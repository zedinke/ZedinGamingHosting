-- Add GameServer-1 to database
INSERT INTO ServerMachine (id, name, ipAddress, sshPort, sshUser, status, createdAt, updatedAt) 
VALUES (UUID(), 'GameServer-1', '95.217.194.148', 22, 'root', 'ONLINE', NOW(), NOW());
