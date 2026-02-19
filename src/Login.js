import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  Icon,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  ButtonGroup,
  FormControl,
  FormLabel
} from '@chakra-ui/react';
import { FaBug, FaUserShield, FaUser } from 'react-icons/fa';
import { motion } from 'framer-motion';

const FloatingBackground = () => {
  const bugIcons = Array.from({ length: 12 });
  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} zIndex={0} pointerEvents="none">
      {bugIcons.map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * 100 + "%", y: "110%", opacity: 0.1 }}
          animate={{ y: "-10%", x: ["0%", "5%", "-5%", "0%"] }}
          transition={{ duration: Math.random() * 15 + 15, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute' }}
        >
          <FaBug size={Math.random() * 30 + 20} color="#CBD5E0" />
        </motion.div>
      ))}
    </Box>
  );
};

function Login({ onLoginSuccess, onSwitchToSignup }) {
  // 1. FIXED: Changed state to use 'email' instead of 'username'
  const [form, setForm] = useState({ email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState('user');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 2. FIXED: Sending 'email' to match server.js requirement
          email: form.email,
          password: form.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Check if user role matches selected role (optional security check)
      if (data.user.role !== selectedRole) {
         // You can strictly block this, or just warn.
         // For now, we'll allow the backend data to dictate the role.
      }

      onLoginSuccess(data.user); // Pass real user data to App.js

    } catch (err) {
      setErrorMsg(err.message);
      onOpen();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" position="relative">
      <FloatingBackground />
      
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderTop="4px solid" borderColor="red.500">
          <ModalHeader color="red.500">Login Failed</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontWeight="bold" mb={2}>We couldn't log you in.</Text>
            <Text color="gray.600">{errorMsg}</Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={onClose}>Try Again</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Flex minH="100vh" align="center" justify="center" p={4} zIndex={1} position="relative">
        <Card direction={{ base: 'column', md: 'row' }} overflow='hidden' variant='outline' boxShadow="2xl" maxW="800px" w="full" bg="whiteAlpha.900" backdropFilter="blur(10px)">
          
          <Box 
            bg={selectedRole === 'admin' ? "red.600" : "blue.500"} 
            w={{ base: "full", md: "40%" }} 
            p={8} 
            color="white" 
            textAlign="center" 
            transition="background 0.3s"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <Icon as={FaBug} w={12} h={12} mb={4} />
            <Heading size="lg">StrikeLog</Heading>
            <Text mt={2} fontSize="sm" opacity={0.8}>
              {selectedRole === 'admin' ? "Admin Console" : "Bug Tracking System"}
            </Text>
          </Box>

          <CardBody p={8}>
            <VStack spacing={6}>
              <Heading size="md">Welcome Back</Heading>
              
              <Box w="full">
                <Text fontSize="sm" mb={2} fontWeight="bold" color="gray.500">I am logging in as:</Text>
                <ButtonGroup w="full" isAttached variant="outline">
                  <Button 
                    w="full" 
                    leftIcon={<FaUser />}
                    colorScheme={selectedRole === 'user' ? "blue" : "gray"} 
                    variant={selectedRole === 'user' ? "solid" : "outline"}
                    onClick={() => setSelectedRole('user')}
                  >
                    User
                  </Button>
                  <Button 
                    w="full" 
                    leftIcon={<FaUserShield />}
                    colorScheme={selectedRole === 'admin' ? "red" : "gray"} 
                    variant={selectedRole === 'admin' ? "solid" : "outline"}
                    onClick={() => setSelectedRole('admin')}
                  >
                    Admin
                  </Button>
                </ButtonGroup>
              </Box>

              <VStack spacing={4} w="full">
                {/* 3. FIXED: Input now binds to form.email */}
                <FormControl>
                    <FormLabel>Email Address</FormLabel>
                    <Input 
                        placeholder="Enter email" 
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})} 
                    />
                </FormControl>
                <FormControl>
                    <FormLabel>Password</FormLabel>
                    <Input 
                        placeholder="Enter password" 
                        type="password" 
                        value={form.password}
                        onChange={e => setForm({...form, password: e.target.value})} 
                    />
                </FormControl>
              </VStack>

              <Button 
                colorScheme={selectedRole === 'admin' ? "red" : "blue"} 
                w="full" 
                isLoading={isLoading} 
                onClick={handleLogin}
              >
                Log In
              </Button>

              <Button variant="link" size="xs" onClick={onSwitchToSignup}>
                Don't have an account? Sign Up
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  );
}

export default Login;