delimiter ;

USE `theodorus`;

drop table `theodorus`.`topic_tags`;

CREATE TABLE `theodorus`.`user_topic_tags` (
  `tag_id` int(11) NOT NULL AUTO_INCREMENT,
  `tag` varchar(20) NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `user_id` varchar(11) DEFAULT NULL,
  PRIMARY KEY (`tag_id`),
  KEY `idx_user_topic_tag_topic` (`topic_id`),
  KEY `idx_user_topic_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;