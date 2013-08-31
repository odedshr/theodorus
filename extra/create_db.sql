delimiter $$

CREATE DATABASE `theodorus` /*!40100 DEFAULT CHARACTER SET utf8 */;

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `display_name` varchar(20) DEFAULT NULL,
  `SN` varchar(9) DEFAULT NULL,
  `slug` varchar(20) DEFAULT NULL,
  `picture` varchar(256) DEFAULT NULL,
  `score` tinyint(4) DEFAULT NULL,
  `penalties` tinyint(4) DEFAULT NULL,
  `badges` varchar(256) DEFAULT NULL,
  `permissions` varchar(256) DEFAULT NULL,
  `revoked-permissions` varchar(256) DEFAULT NULL,
  `email` varchar(256) DEFAULT NULL,
  `birthdate` varchar(8) DEFAULT NULL,
  `language` varchar(2) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  `isEmailVerfied` tinyint(1) DEFAULT NULL,
  `isSNVerfiied` tinyint(1) DEFAULT NULL,
  `isPoliticianCandidate` tinyint(1) DEFAULT NULL,
  `isModeratorCandidate` tinyint(1) DEFAULT NULL,
  `isModerator` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_user_slug` (`slug`),
  KEY `idx_user_status` (`status`),
  KEY `idx_user_moderator` (`isModerator`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8;

CREATE TABLE `user_bio` (
  `user_id` int(11) NOT NULL,
  `bio` text,
  PRIMARY KEY (`user_id`),
  KEY `fk_user_bio` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


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
  `topic_count` tinyint(4) DEFAULT NULL,
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
  `endorsements` tinyint(4) DEFAULT NULL,
  `follows` tinyint(4) DEFAULT NULL,
  `reports` tinyint(4) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL,
  `report_status` varchar(10) DEFAULT NULL,
  `score` float DEFAULT NULL,
  `minimum_votes_required` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`topic_id`),
  KEY `idx_topic_modified` (`modified`),
  KEY `idx_topic_initiator` (`initiator`,`modified`),
  KEY `idx_topic_score` (`score`,`modified`),
  FULLTEXT INDEX `idx_topic_title` (`content` ASC)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

CREATE TABLE `topic_read` (
  `topic_id` int(11) NOT NULL,
  `content` text,
  PRIMARY KEY (`topic_id`),
  FULLTEXT INDEX `idx_topic_read` (`content` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `topic_write` (
  `topic_id` int(11) NOT NULL,
  `content` text,
  PRIMARY KEY (`topic_id`),
  FULLTEXT INDEX `idx_topic_write` (`content` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `topic_tags` (
  `tag` varchar(20) NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`tag`),
  KEY `idx_topic_tag_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `user_topic` (
  `user_id` int(11) NOT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `modified` varchar(12) DEFAULT NULL,
  `read` tinyint(2) DEFAULT NULL,
  `follow` tinyint(1) DEFAULT NULL COMMENT '	',
  `endorse` tinyint(1) DEFAULT NULL,
  `report` tinyint(1) DEFAULT NULL,
  `score` float DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `idx_usertopic_user` (`user_id`,`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `comments` (
  `comment_id` int(11) NOT NULL AUTO_INCREMENT,
  `topic_id` int(11) DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created` varchar(12) DEFAULT NULL,
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

CREATE TABLE `user_comment` (
  `user_id` int(11) NOT NULL,
  `comment_id` int(11) DEFAULT NULL,
  `modified` varchar(12) DEFAULT NULL,
  `read` tinyint(2) DEFAULT NULL,
  `follow` varchar(45) DEFAULT NULL,
  `endorse` tinyint(1) DEFAULT NULL,
  `report` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8$$

