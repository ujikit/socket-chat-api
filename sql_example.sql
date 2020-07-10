CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    id_socket VARCHAR(255),
    role VARCHAR(255)
)  ENGINE=INNODB;

CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255),
    sender_username VARCHAR(255),
    receiver_username VARCHAR(255),
    time_message INT
)  ENGINE=INNODB;


SELECT * FROM users;
SELECT * FROM conversations;

INSERT INTO users (username, id_socket, role) values ('ujikit', NULL, 'member');
INSERT INTO users (username, id_socket, role) values ('umar', NULL, 'member');
INSERT INTO users (username, id_socket, role) values ('FO1', NULL, 'fo');
INSERT INTO users (username, id_socket, role) values ('FO2', NULL, 'fo');
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('hey ujikit', 'FO1', 'ujikit', 1594312555);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('Ada yang bisa dibantu', 'FO1', 'ujikit', 1594312346);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('hey umar', 'FO1', 'umar', 1594312346);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('hey FO1', 'ujikit', 'FO1', 1594312351);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('hey ujikit', 'FO2', 'ujikit', 1594312352);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('hey sedang apa', 'FO2', 'ujikit', 1594312354);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('hey ada kamar kosong', 'FO2', 'umar', 1594312354);
INSERT INTO conversations (message, sender_username, receiver_username, time_message) values ('Maaf kamar masih?', 'ujikit', 'FO2', 1594317774);

ALTER TABLE conversations ADD COLUMN time_message INT;
