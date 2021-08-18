CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(45) NOT NULL,
  `mobile_no` bigint NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(45) NOT NULL,
  PRIMARY KEY (`id`,`mobile_no`)
)  ;


CREATE TABLE `buy_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `buyer` int NOT NULL,
  `pname` varchar(45) NOT NULL,
  `pprice` int NOT NULL,
  `pdesc` varchar(255) NOT NULL,
  `rprice` int NOT NULL,
  `lat1` float NOT NULL,
  `lng1` float NOT NULL,
  `lat2` float NOT NULL,
  `lng2` float NOT NULL,
  `pimage` varchar(255) DEFAULT NULL,
  `address1` varchar(255) DEFAULT NULL,
  `address2` varchar(255) DEFAULT NULL,
  `accepted` tinyint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `id_idx` (`buyer`),
  CONSTRAINT `id` FOREIGN KEY (`buyer`) REFERENCES `users` (`id`)
)  ;

CREATE TABLE `helper_details` (
  `hid` int NOT NULL,
  `lat1` float NOT NULL,
  `lng1` float NOT NULL,
  `lat2` float NOT NULL,
  `lng2` float NOT NULL
)  ;


CREATE TABLE `ongoing_requests` (
  `prod_id` int NOT NULL,
  `helper_id` int NOT NULL,
  `buyer` int NOT NULL,
  PRIMARY KEY (`prod_id`,`helper_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

  