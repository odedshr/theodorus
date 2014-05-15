delimiter ;

USE `theodorus`;

ALTER TABLE `theodorus`.`topics` ADD COLUMN `opinion` INT(11) NULL DEFAULT '0'  AFTER `report` ;
