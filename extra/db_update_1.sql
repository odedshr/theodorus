delimiter ;

USE `theodorus`;

ALTER TABLE `theodorus`.`topics` ADD COLUMN `opinion` INT(11) NULL DEFAULT '0'  AFTER `report` ;
ALTER TABLE `theodorus`.`comments`
  ADD COLUMN `opinion_id` INT(11) NULL  DEFAULT '0' AFTER `topic_id`,
  CHANGE COLUMN `parent_id` `parent_id` INT(11) NULL DEFAULT 0  ;
UPDATE `theodorus`.`comments` set `opinion_id`=0 WHERE `comment_id`>1
