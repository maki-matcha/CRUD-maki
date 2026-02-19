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
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  IconButton,
  ButtonGroup, // Added for role selection
  useToast
} from '@chakra-ui/react';
import { FaBug, FaUserPlus, FaEye, FaEyeSlash, FaUser, FaUserShield } from 'react-icons/fa';
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

function Signup({ onSignup, onSwitchToLogin }) {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    role: 'user' // Default role
  });
  
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSignup = async () => {
    if (form.password !== form.confirmPassword) {
      toast({ title: "Passwords do not match", status: "error" });
      return;
    }

    if (!form.username || !form.email) {
      toast({ title: "Please fill in all fields", status: "error" });
      return;
    }

    // debug output
    console.log('Submitting signup with form:', form);

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username, // Fixed: Added username to payload
          email: form.email,
          password: form.password,
          role: form.role // Sending the selected role
        })
      });

      const data = await response.json();
      console.log('Signup response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      onSignup(data.user);

    } catch (err) {
      toast({
        title: "Registration Failed",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" position="relative">
      <FloatingBackground />

      <Flex minH="100vh" align="center" justify="center" p={4} zIndex={1} position="relative">
        <Card 
          direction={{ base: 'column', md: 'row' }} 
          overflow='hidden' 
          variant='outline' 
          boxShadow="2xl" 
          maxW="800px" 
          w="full" 
          bg="whiteAlpha.900" 
          backdropFilter="blur(10px)"
        >
          <Box 
            bg={form.role === 'admin' ? "red.600" : "blue.500"} 
            w={{ base: "full", md: "40%" }} 
            p={8} 
            color="white" 
            textAlign="center" 
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            transition="background 0.3s ease"
          >
            <Icon as={form.role === 'admin' ? FaUserShield : FaUserPlus} w={12} h={12} mb={4} />
            <Heading size="lg">Join StrikeLog</Heading>
            <Text mt={2} fontSize="sm" opacity={0.9}>
              {form.role === 'admin' ? "Create an administrator account." : "Create an account to start tracking bugs."}
            </Text>
          </Box>

          <CardBody p={8}>
            <VStack spacing={4}>
              <Heading size="md" alignSelf="flex-start">Create Account</Heading>

              {/* Role Selection Tool */}
              <Box w="full">
                <Text fontSize="xs" mb={2} fontWeight="bold" color="gray.500">REGISTER AS:</Text>
                <ButtonGroup w="full" isAttached variant="outline" size="sm">
                  <Button 
                    w="full" 
                    leftIcon={<FaUser />}
                    colorScheme={form.role === 'user' ? "blue" : "gray"} 
                    variant={form.role === 'user' ? "solid" : "outline"}
                    onClick={() => setForm({...form, role: 'user'})}
                  >
                    User
                  </Button>
                  <Button 
                    w="full" 
                    leftIcon={<FaUserShield />}
                    colorScheme={form.role === 'admin' ? "red" : "gray"} 
                    variant={form.role === 'admin' ? "solid" : "outline"}
                    onClick={() => setForm({...form, role: 'admin'})}
                  >
                    Admin
                  </Button>
                </ButtonGroup>
              </Box>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Username</FormLabel>
                <Input 
                  size="sm"
                  placeholder="Choose a username" 
                  value={form.username}
                  onChange={e => setForm({...form, username: e.target.value})}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Email Address</FormLabel>
                <Input 
                  size="sm"
                  type="email"
                  placeholder="Enter your email" 
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Password</FormLabel>
                <InputGroup size="sm">
                  <Input 
                    type={showPass ? "text" : "password"} 
                    placeholder="Create a password" 
                    value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                  />
                  <InputRightElement>
                    <IconButton 
                      variant="ghost" 
                      size="xs" 
                      icon={showPass ? <FaEyeSlash /> : <FaEye />} 
                      onClick={() => setShowPass(!showPass)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Confirm Password</FormLabel>
                <InputGroup size="sm">
                  <Input 
                    type={showConfirm ? "text" : "password"} 
                    placeholder="Confirm your password" 
                    value={form.confirmPassword}
                    onChange={e => setForm({...form, confirmPassword: e.target.value})}
                  />
                  <InputRightElement>
                    <IconButton 
                      variant="ghost" 
                      size="xs" 
                      icon={showConfirm ? <FaEyeSlash /> : <FaEye />} 
                      onClick={() => setShowConfirm(!showConfirm)}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button 
                colorScheme={form.role === 'admin' ? "red" : "blue"} 
                w="full" 
                size="md"
                mt={2}
                isLoading={isLoading} 
                onClick={handleSignup}
              >
                Sign Up
              </Button>

              <Button variant="link" size="xs" color="gray.500" onClick={onSwitchToLogin}>
                Already have an account? Log In
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Flex>
    </Box>
  );
}

export default Signup;