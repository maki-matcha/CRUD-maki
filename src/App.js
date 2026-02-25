import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ChakraProvider,
  extendTheme,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  useToast,
  Card,
  CardBody,
  Spacer,
  Badge,
  Container,
  Select,
  Flex,
  SimpleGrid,
  Icon,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { 
  FaBug, 
  FaUser, 
  FaSignOutAlt, 
  FaRocket, 
  FaListUl, 
  FaFileUpload,

  FaSort
} from 'react-icons/fa';

// --- IMPORT YOUR COMPONENTS ---
import Admin from './Admin';
import Login from './Login';
import Signup from './Signup';

const theme = extendTheme({
  styles: {
    global: {
      body: { bg: "gray.50", overflowX: 'hidden' },
    },
  },
});

const getStatusColor = (status) => {
  switch (status) {
    case 'Open': return 'orange';
    case 'In Progress': return 'blue';
    case 'Resolved': return 'purple';
    case 'Closed': return 'green';
    default: return 'gray';
  }
};

const getSeverityColor = (severity) => {
  switch (severity) {
    case 'Blocker': return 'red';
    case 'Critical': return 'orange';
    case 'High': return 'yellow';
    case 'Medium': return 'blue';
    case 'Low': return 'green';
    default: return 'gray';
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

// --- MAIN APP COMPONENT ---
function App() {
  const [user, setUser] = useState(null); 
  const [isSignup, setIsSignup] = useState(false);
  const [bugs, setBugs] = useState([]); // Empty initially, loaded via API
  
  // Form State
  const [newBug, setNewBug] = useState({ title: '', description: '', severity: 'Medium', affectedFile: '' });
  const [file, setFile] = useState(null);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const { isOpen: isFileOpen, onOpen: onFileOpen, onClose: onFileClose } = useDisclosure();
  const [selectedBugFile, setSelectedBugFile] = useState(null);

  const toast = useToast();
  const fileInputRef = useRef();

  // --- 1. LOAD DATA FROM SERVER ---
  useEffect(() => {
    // Only fetch if a user is logged in
    if (user) {
      fetch('http://localhost:5000/api/bugs')
        .then(res => res.json())
        .then(data => setBugs(data))
        .catch(err => console.error("Error loading bugs:", err));
    }
  }, [user]);

  // --- AUTH HANDLERS ---
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // FIX: Changed userData.fullname to userData.username
    toast({ title: `Welcome, ${userData.username}`, status: "success" });
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    toast({ title: "Account Created", status: "success" });
  };

  const handleLogout = () => {
    setUser(null);
    setBugs([]); // Clear sensitive data on logout
    setIsSignup(false);
  };

  // --- 2. REPORT BUG (POST to Server) ---
  const handleAddBug = async () => {
    if (!newBug.title || !newBug.description) {
      toast({ title: "Error", description: "Title and description are required.", status: "error" });
      return;
    }

    const bugPayload = {
      ...newBug,
      status: 'Open',
      reporter: user.username, // Using username as reporter ID
      affectedFile: newBug.affectedFile || (file ? file.name : 'No file specified')
    };

    try {
      const response = await fetch('http://localhost:5000/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bugPayload)
      });

      if (!response.ok) throw new Error('Failed to save bug');

      const savedBug = await response.json();
      
      // Update local state with the real bug from DB
      setBugs([savedBug, ...bugs]); 
      
      // Reset Form
      setNewBug({ title: '', description: '', severity: 'Medium', affectedFile: '' });
      setFile(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      
      toast({ title: "Bug Reported", status: "success" });
    } catch (err) {
      toast({ title: "Error", description: err.message, status: "error" });
    }
  };
// --- 3. UPDATE STATUS (PATCH to Server) ---
  // --- 3. UPDATE STATUS (PATCH to Server) ---
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bugs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setBugs(bugs.map(b => b._id === id ? { ...b, status: newStatus } : b));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- 4. DELETE BUG (DELETE from Server) ---
  const deleteBug = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bugs/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBugs(bugs.filter(b => b._id !== id));
        toast({ title: "Bug Deleted", status: "info" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!newBug.affectedFile) {
        setNewBug({ ...newBug, affectedFile: selected.name });
      }
    }
  };

  const handleOpenFile = (bug) => {
    setSelectedBugFile(bug);
    onFileOpen();
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUserBugs = useMemo(() => {
    let data = bugs.filter(b => b.reporter === user?.username);
    if (sortConfig.key) {
      data.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [bugs, user, sortConfig]);

  if (!user) {
    return (
      <ChakraProvider theme={theme}>
        {isSignup ? (
          <Signup 
            onSignup={handleSignupSuccess} 
            onSwitchToLogin={() => setIsSignup(false)} 
          />
        ) : (
          <Login 
            onLoginSuccess={handleLoginSuccess} 
            onSwitchToSignup={() => setIsSignup(true)} 
          />
        )}
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider theme={theme}>
      <Box minH="100vh" bg="gray.50">
        <Box bg="white" px={8} py={4} shadow="sm" position="sticky" top={0} zIndex={10}>
          <Flex alignItems="center">
            <HStack spacing={3}>
              <Box bg={user.role === 'admin' ? 'red.500' : 'blue.500'} p={2} borderRadius="lg">
                 <Icon as={FaBug} color="white" boxSize={5} />
              </Box>
              <Heading size="md" color="gray.700">StrikeLog</Heading>
            </HStack>
            <Spacer />
            <HStack spacing={4}>
              <HStack display={{ base: 'none', md: 'flex' }}>
                <Icon as={FaUser} color="gray.400" />
                {/* FIX: Changed user.fullname to user.username */}
                <Text fontWeight="medium" fontSize="sm">{user.username} ({user.role})</Text>
              </HStack>
              <Button leftIcon={<FaSignOutAlt />} size="sm" variant="ghost" colorScheme="red" onClick={handleLogout}>
                Logout
              </Button>
            </HStack>
          </Flex>
        </Box>

        <Modal isOpen={isFileOpen} onClose={onFileClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>File Attachment</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedBugFile ? (
                <Box>
                  <Text fontWeight="bold" mb={2}>File Name: {selectedBugFile.affectedFile}</Text>
                  <Box p={10} bg="gray.100" borderRadius="md" textAlign="center">
                      <Icon as={FaFileUpload} boxSize={10} color="gray.400" mb={3} />
                      <Text>Preview not available (File storage not connected).</Text>
                  </Box>
                </Box>
              ) : (
                <Text>No file attached.</Text>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        <Container maxW="container.xl" py={8}>
          {user.role === 'admin' ? (
            <Admin 
              bugs={bugs} 
              updateStatus={updateStatus} 
              deleteBug={deleteBug}
              getStatusColor={getStatusColor}
              getSeverityColor={getSeverityColor}
              onOpenFile={handleOpenFile}
              formatDate={formatDate}
            />
          ) : (
            <VStack spacing={8} align="stretch">
              <Box>
                <Heading size="lg" mb={6} display="flex" alignItems="center">
                  <Icon as={FaRocket} mr={3} color="blue.500" />
                  Report New Issue
                </Heading>
                <Card bg="white" shadow="lg" borderRadius="xl" borderTop="4px solid" borderColor="blue.500">
                  <CardBody>
                    <VStack spacing={5}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="full">
                        <Box>
                          <Text mb={2} fontWeight="bold" fontSize="sm">Issue Title</Text>
                          <Input 
                            placeholder="e.g., unexpected crash on login" 
                            value={newBug.title} 
                            onChange={(e) => setNewBug({...newBug, title: e.target.value})}
                          />
                        </Box>
                        <Box>
                           <Text mb={2} fontWeight="bold" fontSize="sm">Severity</Text>
                           <Select 
                              value={newBug.severity} 
                              onChange={(e) => setNewBug({...newBug, severity: e.target.value})}
                           >
                              <option value="Low">Low - Cosmetic issue</option>
                              <option value="Medium">Medium - Standard bug</option>
                              <option value="High">High - Core function broken</option>
                              <option value="Critical">Critical - App crash</option>
                           </Select>
                        </Box>
                      </SimpleGrid>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5} w="full">
                         <Box>
                            <Text mb={2} fontWeight="bold" fontSize="sm">Affected Component / File</Text>
                            <Input 
                              placeholder="e.g., Navbar.js" 
                              value={newBug.affectedFile} 
                              onChange={(e) => setNewBug({...newBug, affectedFile: e.target.value})}
                            />
                         </Box>
                         <Box>
                            <Text mb={2} fontWeight="bold" fontSize="sm">Evidence (Screenshot/Log)</Text>
                            <Input 
                              type="file" 
                              p={1} 
                              ref={fileInputRef} 
                              onChange={handleFileChange} 
                              variant="unstyled"
                              border="1px dashed"
                              borderColor="gray.300"
                              borderRadius="md"
                              _hover={{ borderColor: 'blue.400' }}
                            />
                         </Box>
                      </SimpleGrid>

                      <Box w="full">
                        <Text mb={2} fontWeight="bold" fontSize="sm">Description & Steps to Reproduce</Text>
                        <Textarea 
                          placeholder="Describe exactly what happened..." 
                          rows={4}
                          value={newBug.description} 
                          onChange={(e) => setNewBug({...newBug, description: e.target.value})}
                        />
                      </Box>
                      
                      <Button leftIcon={<FaBug />} colorScheme="blue" size="lg" w="full" onClick={handleAddBug}>
                        Submit Report
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>

              <Box>
                <Heading size="lg" mb={6} display="flex" alignItems="center">
                  <Icon as={FaListUl} mr={3} color="purple.500" />
                  My Reported Issues
                </Heading>
                
                <Card bg="white" shadow="md" borderRadius="xl" overflow="hidden">
                  <TableContainer>
                    <Table variant="simple">
                      <Thead bg="gray.50">
                        <Tr>
                          <Th cursor="pointer" onClick={() => handleSort('title')}>
                             <HStack><Text>Issue</Text><Icon as={FaSort} /></HStack>
                          </Th>
                          <Th cursor="pointer" onClick={() => handleSort('status')}>
                             <HStack><Text>Status</Text><Icon as={FaSort} /></HStack>
                          </Th>
                          <Th>Severity</Th>
                          <Th>Date</Th>
                          <Th>File</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sortedUserBugs.length === 0 ? (
                            <Tr>
                                <Td colSpan={5} textAlign="center" py={8} color="gray.500">
                                    You haven't reported any bugs yet.
                                </Td>
                            </Tr>
                        ) : (
                            sortedUserBugs.map((bug) => (
                            <Tr key={bug._id} _hover={{ bg: "gray.50" }}>
                                <Td fontWeight="medium">
                                    {bug.title}
                                    <Text fontSize="xs" color="gray.500" noOfLines={1}>{bug.description}</Text>
                                </Td>
                                <Td>
                                    <Badge colorScheme={getStatusColor(bug.status)} variant="subtle" px={2} py={1} borderRadius="full">
                                        {bug.status}
                                    </Badge>
                                </Td>
                                <Td>
                                    <Badge colorScheme={getSeverityColor(bug.severity)} variant="outline">
                                        {bug.severity}
                                    </Badge>
                                </Td>
                                <Td fontSize="sm" color="gray.600">
                                    {formatDate(bug.createdAt)}
                                </Td>
                                <Td>
                                {bug.affectedFile ? (
                                    <HStack spacing={2}>
                                        <Text fontSize="xs" color="gray.500" maxW="100px" isTruncated title={bug.affectedFile}>
                                            {bug.affectedFile}
                                        </Text>
                                    </HStack>
                                ) : (
                                    <Text fontSize="xs" color="gray.400">-</Text>
                                )}
                                </Td>
                            </Tr>
                            ))
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Card>
              </Box>
            </VStack>
          )}
        </Container>
      </Box>
    </ChakraProvider>
  );
}

export default App;