delimiter ;

CREATE DATABASE IF NOT EXISTS `theodorus` DEFAULT CHARACTER SET utf8;

USE `theodorus`;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(20) DEFAULT NULL,
  `SN` varchar(9) DEFAULT NULL,
  `isSNVerified` tinyint(1) DEFAULT '0',
  `slug` varchar(20) DEFAULT NULL,
  `isPolitician` tinyint(1) DEFAULT '0',
  `isModerator` tinyint(1) DEFAULT '0',
  `picture` varchar(256) DEFAULT NULL,
  `birthday` varchar(8) DEFAULT NULL,
  `language` varchar(2) DEFAULT NULL,
  `score` float DEFAULT NULL,
  `penalties` float DEFAULT NULL,
  `badges` text,
  `permissions` text,
  `revoked` text,
  PRIMARY KEY (`user_id`),
  KEY `idx_user_slug` (`slug`),
  KEY `idx_user_moderator` (`isModerator`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

CREATE TABLE `credentials` (
  `auth_key` varchar(128) NOT NULL,
  `password` varchar(128) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`auth_key`),
  UNIQUE KEY `auth_key_UNIQUE` (`auth_key`),
  KEY `fk_credential_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `tags` (
  `tag` varchar(20) NOT NULL,
  `count` tinyint(4) DEFAULT NULL,
  `color` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `topics` (
  `topic_id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(20) DEFAULT NULL,
  `created` varchar(24) DEFAULT NULL,
  `modified` varchar(24) DEFAULT NULL,
  `initiator` int(11) DEFAULT NULL,
  `title` varchar(140) DEFAULT NULL,
  `tags` varchar(1024) DEFAULT NULL,
  `seen` int(11) DEFAULT NULL,
  `follow` int(11) DEFAULT NULL,
  `endorse` int(11) DEFAULT NULL,
  `report` int(11) DEFAULT NULL,
  `comment` int(11) DEFAULT NULL,
  `votes_required` int(11) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  `report_status` varchar(10) DEFAULT NULL,
  `score` float DEFAULT NULL,
  `extra` text,
  PRIMARY KEY (`topic_id`),
  KEY `idx_topic_modified` (`modified`),
  KEY `idx_topic_initiator` (`initiator`,`modified`),
  KEY `idx_topic_score` (`modified`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8;

CREATE TABLE `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created` varchar(24) DEFAULT NULL,
  `content` varchar(140) DEFAULT NULL,
  `endorsements` tinyint(4) DEFAULT NULL,
  `likes` tinyint(4) DEFAULT NULL,
  `reports` tinyint(4) DEFAULT NULL,
  `report_status` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`comment_id`),
  KEY `idx_comment_topic` (`topic_id`,`parent_id`,`created`),
  KEY `idx_comment_user` (`user_id`,`created`),
  KEY `fk_comment_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `topic_read` (
  `topic_id` int(11) NOT NULL,
  `content` text,
  PRIMARY KEY (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `topic_tags` (
  `tag` varchar(20) NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`tag`),
  KEY `idx_topic_tag_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `topic_write` (
  `topic_id` int(11) NOT NULL,
  `content` text,
  PRIMARY KEY (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user_bio` (
  `user_id` int(11) NOT NULL,
  `bio` text,
  PRIMARY KEY (`user_id`),
  KEY `fk_user_bio` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user_comment` (
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) DEFAULT NULL,
  `modified` varchar(12) DEFAULT NULL,
  `read` tinyint(2) DEFAULT NULL,
  `follow` varchar(45) DEFAULT NULL,
  `endorse` tinyint(1) DEFAULT NULL,
  `report` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user_topic` (
  `user_id` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `modified` varchar(24) DEFAULT NULL,
  `seen` tinyint(1) DEFAULT NULL,
  `follow` tinyint(1) DEFAULT NULL COMMENT '	',
  `endorse` tinyint(1) DEFAULT NULL,
  `report` tinyint(1) DEFAULT NULL,
  `score` float DEFAULT NULL,
  KEY `idx_usertopic_user` (`user_id`,`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

