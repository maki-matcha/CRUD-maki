import React, { useState, useMemo } from 'react';
import {
  Box, Heading, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Badge, Select,
  IconButton, Button, HStack, Text, Card, CardBody, Stat, StatLabel, StatNumber,
  SimpleGrid, Icon, Divider, Tooltip as ChakraTooltip, Tabs, TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import { 
  FaTrash, FaExternalLinkAlt, FaSort, FaSortUp, FaSortDown, FaChartPie, FaChartBar, FaChartLine, FaCheck, FaUndo
} from 'react-icons/fa';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const severityWeights = {'Blocker': 5, 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1};
const COLORS = ['#805AD5', '#E53E3E', '#DD6B20', '#D69E2E', '#319795'];

function Admin({ bugs, updateStatus, deleteBug, getStatusColor, getSeverityColor, onOpenFile, formatDate }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });

  // --- STATS CALCULATIONS ---
  // "Resolved" now technically means "Pending Closure", so we might want to count 'Closed' as the final success metric.
  const openCount = bugs.filter(b => b.status === 'Open').length;
  const inProgressCount = bugs.filter(b => b.status === 'In Progress').length;
  // We track "Closed" as the final completed count
  const closedCount = bugs.filter(b => b.status === 'Closed').length;
  const criticalCount = bugs.filter(b => b.severity === 'Blocker' || b.severity === 'Critical').length;

  // --- CHART DATA PREPARATION ---
  const severityData = useMemo(() => {
    const counts = { Blocker: 0, Critical: 0, High: 0, Medium: 0, Low: 0 };
    bugs.forEach(bug => { if (counts[bug.severity] !== undefined) counts[bug.severity]++; });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [bugs]);

  const weeklyData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    const dataMap = last7Days.reduce((acc, date) => { acc[date] = { date, submitted: 0, resolved: 0 }; return acc; }, {});
    
    bugs.forEach(bug => {
      const bugDate = new Date(bug.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dataMap[bugDate]) {
        dataMap[bugDate].submitted += 1;
        // Count as "done" only if Closed
        if (bug.status === 'Closed') dataMap[bugDate].resolved += 1;
      }
    });
    return Object.values(dataMap);
  }, [bugs]);

  // --- SORTING LOGIC ---
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const sortedBugs = useMemo(() => {
    let data = [...bugs];
    if (sortConfig.key === 'severity') {
      data.sort((a, b) => {
        const weightA = severityWeights[a.severity] || 0;
        const weightB = severityWeights[b.severity] || 0;
        if (weightA < weightB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (weightA > weightB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [bugs, sortConfig]);

  // --- UPDATED FILTER LOGIC ---
  // Active = Anything NOT 'Closed' (Includes 'Resolved')
  const activeBugs = sortedBugs.filter(b => b.status !== 'Closed');
  // Completed = Only 'Closed'
  const completedBugs = sortedBugs.filter(b => b.status === 'Closed');

  const VEmptyState = ({ message }) => (<Box textAlign="center"><Text fontStyle="italic">{message}</Text></Box>);

  return (
    <Box>
      <Heading size="lg" mb={6}>Admin Dashboard</Heading>
      
      {/* --- STATS GRID --- */}
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        <Card bg="white" shadow="sm" borderLeft="4px solid" borderColor="orange.400">
          <CardBody>
            <Stat>
              <StatLabel>Open Issues</StatLabel>
              <StatNumber>{openCount}</StatNumber>
              <Text fontSize="xs" color="gray.500">{inProgressCount} in progress</Text>
            </Stat>
          </CardBody>
        </Card>
        <Card bg="white" shadow="sm" borderLeft="4px solid" borderColor="green.400">
          <CardBody>
            <Stat><StatLabel>Total Closed</StatLabel><StatNumber>{closedCount}</StatNumber></Stat>
          </CardBody>
        </Card>
        <Card bg="white" shadow="sm" borderLeft="4px solid" borderColor="red.500">
          <CardBody>
            <Stat><StatLabel>Critical / Blocker</StatLabel><StatNumber>{criticalCount}</StatNumber></Stat>
          </CardBody>
        </Card>
        <Card bg="white" shadow="sm" borderLeft="4px solid" borderColor="gray.400">
          <CardBody>
            <Stat><StatLabel>Total Reports</StatLabel><StatNumber>{bugs.length}</StatNumber></Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* --- TABBED TABLES --- */}
      <Card bg="white" shadow="lg" borderRadius="xl" overflow="hidden" mb={10}>
        <Tabs variant="soft-rounded" colorScheme="blue" p={4}>
          <TabList mb={4}>
            <Tab _selected={{ color: 'white', bg: 'orange.400' }}>
              Active <Badge ml={2} borderRadius="full" colorScheme="orange" variant="solid">{activeBugs.length}</Badge>
            </Tab>
            <Tab _selected={{ color: 'white', bg: 'green.400' }}>
              Completed <Badge ml={2} borderRadius="full" colorScheme="green" variant="solid">{completedBugs.length}</Badge>
            </Tab>
          </TabList>
          <TabPanels>
            
            {/* ACTIVE PANEL */}
            <TabPanel p={0}>
              <TableContainer>
                <Table variant="simple" size="md">
                  <Thead bg="gray.50">
                    <Tr>
                      <Th>Issue</Th>
                      <Th onClick={() => handleSort('severity')} cursor="pointer" _hover={{ bg: "gray.100" }}>
                          <HStack spacing={1}>
                            <Text>Severity</Text>
                            <Icon as={sortConfig.key === 'severity' ? (sortConfig.direction === 'asc' ? FaSortUp : FaSortDown) : FaSort} boxSize={3} color="gray.400" />
                          </HStack>
                      </Th>
                      <Th>Evidence</Th>
                      <Th>Status Action</Th>
                      <Th>Mark Fixed</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {activeBugs.length === 0 ? (
                      <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500"><VEmptyState message="No active issues. Great work!" /></Td></Tr>
                    ) : (
                      activeBugs.map((bug) => (
                        <Tr key={bug._id} _hover={{ bg: "gray.50" }}>
                          <Td>
                            <Box>
                              <Text fontWeight="bold">{bug.title}</Text>
                              <Text fontSize="xs" color="gray.500" maxW="250px" isTruncated>{bug.description}</Text>
                            </Box>
                          </Td>
                          <Td><Badge variant="subtle" colorScheme={getSeverityColor(bug.severity)}>{bug.severity}</Badge></Td>
                          <Td>
                            {bug.affectedFile !== 'No file specified' ? (
                              <Button leftIcon={<FaExternalLinkAlt />} size="xs" variant="outline" onClick={() => onOpenFile(bug)}>
                                View File
                              </Button>
                            ) : <Text fontSize="xs" color="gray.400">-</Text>}
                          </Td>
                          <Td>
                            <Select 
                              size="sm" 
                              value={bug.status} 
                              onChange={(e) => updateStatus(bug._id, e.target.value)} 
                              w="140px" 
                              bg="white" 
                              borderColor={getStatusColor(bug.status)}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </Select>
                          </Td>
                          <Td>
                            <HStack>
                              <ChakraTooltip label="Complete" hasArrow>
                                <IconButton 
                                  icon={<FaCheck />} 
                                  colorScheme="green" 
                                  size="sm" 
                                  // HERE IS THE FIX: Button updates status to 'Closed'
                                  onClick={() => updateStatus(bug._id, 'Closed')}
                                  // Disabled unless status is 'Resolved' first
                                  isDisabled={bug.status !== 'Resolved'}
                                />
                              </ChakraTooltip>
                              <IconButton icon={<FaTrash />} colorScheme="red" variant="ghost" size="sm" onClick={() => deleteBug(bug._id)} />
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>

            {/* COMPLETED PANEL */}
            <TabPanel p={0}>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead bg="gray.50">
                    <Tr><Th>Issue</Th><Th>Reporter</Th><Th>Resolved Date</Th><Th>Status</Th><Th>Actions</Th></Tr>
                  </Thead>
                  <Tbody>
                    {completedBugs.length === 0 ? (
                      <Tr><Td colSpan={5} textAlign="center" py={10} color="gray.500"><VEmptyState message="No closed issues yet." /></Td></Tr>
                    ) : (
                      completedBugs.map((bug) => (
                        <Tr key={bug._id} _hover={{ bg: "gray.50" }}>
                          <Td><Text as="s" color="gray.500" fontWeight="bold">{bug.title}</Text></Td>
                          <Td>{bug.reporter || 'Unknown'}</Td>
                          <Td>{formatDate(new Date())}</Td>
                          <Td><Badge colorScheme="green">Closed</Badge></Td>
                          <Td>
                            <HStack>
                              <ChakraTooltip label="Reopen" hasArrow>
                                <IconButton icon={<FaUndo />} variant="outline" colorScheme="orange" size="sm" onClick={() => updateStatus(bug._id, 'In Progress')} />
                              </ChakraTooltip>
                              <IconButton icon={<FaTrash />} colorScheme="red" variant="ghost" size="sm" onClick={() => deleteBug(bug._id)} />
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Card>
      
      <Divider mb={10} />
      <Heading size="md" mb={6} color="gray.500">Analytics Overview</Heading>

      {/* --- CHARTS GRID --- */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} mb={8}>
        <Card bg="white" shadow="md" borderRadius="xl">
          <CardBody>
            <HStack mb={4}>
              <Icon as={FaChartPie} color="red.500" />
              <Heading size="sm">Bugs by Severity</Heading>
            </HStack>
            <Box h="250px">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                    {severityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
        
        <Card bg="white" shadow="md" borderRadius="xl">
          <CardBody>
            <HStack mb={4}>
              <Icon as={FaChartBar} color="blue.500" />
              <Heading size="sm">Weekly Volume</Heading>
            </HStack>
            <Box h="250px">
              <ResponsiveContainer>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="submitted" name="New Bugs" fill="#F56565" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved" name="Closed" fill="#48BB78" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* --- LINE GRAPH --- */}
      <Card bg="white" shadow="md" borderRadius="xl" mb={8}>
        <CardBody>
          <HStack mb={4}>
            <Icon as={FaChartLine} color="purple.500" />
            <Heading size="sm">Activity Trend</Heading>
          </HStack>
          <Box h="300px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="submitted" name="New Bugs" stroke="#F56565" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="resolved" name="Closed" stroke="#48BB78" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
}

export default Admin;