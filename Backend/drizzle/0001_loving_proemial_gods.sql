CREATE TABLE `airports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`iataCode` varchar(3) NOT NULL,
	`icaoCode` varchar(4),
	`name` varchar(180) NOT NULL,
	`cityId` int NOT NULL,
	`state` varchar(120) NOT NULL,
	`country` varchar(80) NOT NULL DEFAULT 'India',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `airports_id` PRIMARY KEY(`id`),
	CONSTRAINT `airports_iata_uq` UNIQUE(`iataCode`)
);
--> statement-breakpoint
CREATE TABLE `anomalyRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fareObservationId` int NOT NULL,
	`severity` enum('normal','low','medium','high','critical') NOT NULL,
	`reviewStatus` enum('pending','confirmed','false_positive','resolved') NOT NULL DEFAULT 'pending',
	`anomalyScore` decimal(5,4) NOT NULL,
	`ruleScore` decimal(5,4) NOT NULL,
	`statisticalScore` decimal(5,4) NOT NULL,
	`baselineMedian` decimal(12,2),
	`percentDifference` decimal(10,2),
	`detectionMethods` json NOT NULL,
	`explanation` text NOT NULL,
	`reviewedByUserId` int,
	`reviewedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anomalyRecords_id` PRIMARY KEY(`id`),
	CONSTRAINT `anomalies_fare_observation_uq` UNIQUE(`fareObservationId`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(80) NOT NULL,
	`entityId` varchar(80),
	`requestId` varchar(80),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carriers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`iataCode` varchar(2) NOT NULL,
	`icaoCode` varchar(3),
	`country` varchar(80) NOT NULL DEFAULT 'India',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carriers_id` PRIMARY KEY(`id`),
	CONSTRAINT `carriers_iata_uq` UNIQUE(`iataCode`),
	CONSTRAINT `carriers_name_uq` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`state` varchar(120) NOT NULL,
	`country` varchar(80) NOT NULL DEFAULT 'India',
	`countryCode` varchar(2) NOT NULL DEFAULT 'IN',
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`),
	CONSTRAINT `cities_name_state_uq` UNIQUE(`name`,`state`)
);
--> statement-breakpoint
CREATE TABLE `dataSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(80) NOT NULL,
	`displayName` varchar(140) NOT NULL,
	`kind` enum('airline','ota','api','manual') NOT NULL,
	`reliabilityScore` decimal(5,2) NOT NULL DEFAULT 70,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastIngestedAt` datetime,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dataSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `data_sources_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `fareObservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idempotencyKey` varchar(128) NOT NULL,
	`observationFingerprint` varchar(128) NOT NULL,
	`routeId` int NOT NULL,
	`originCityId` int NOT NULL,
	`destinationCityId` int NOT NULL,
	`originAirportId` int NOT NULL,
	`destinationAirportId` int NOT NULL,
	`carrierId` int NOT NULL,
	`flightId` int,
	`flightNumber` varchar(12),
	`sourceId` int NOT NULL,
	`observationAt` datetime NOT NULL,
	`bookingDate` date NOT NULL,
	`travelDate` date NOT NULL,
	`departureAt` datetime,
	`arrivalAt` datetime,
	`flightDurationMinutes` int,
	`passengerCount` int NOT NULL DEFAULT 1,
	`cabinClass` enum('economy','premium_economy','business','first') NOT NULL DEFAULT 'economy',
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`baseFare` decimal(12,2) NOT NULL,
	`taxes` decimal(12,2) NOT NULL DEFAULT 0,
	`fees` decimal(12,2) NOT NULL DEFAULT 0,
	`totalFare` decimal(12,2) NOT NULL,
	`normalizedFareInr` decimal(12,2) NOT NULL,
	`bookingWindowDays` int NOT NULL,
	`cpiCompatibilityScore` decimal(5,2) NOT NULL,
	`cpiScoreVersion` varchar(24) NOT NULL DEFAULT 'v1',
	`cpiScoreBreakdown` json NOT NULL,
	`validationStatus` enum('valid','flagged','rejected') NOT NULL DEFAULT 'valid',
	`isDuplicate` boolean NOT NULL DEFAULT false,
	`duplicateOfId` int,
	`isAnomaly` boolean NOT NULL DEFAULT false,
	`anomalyScore` decimal(5,4) NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fareObservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `fares_idempotency_key_uq` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `flights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`carrierId` int NOT NULL,
	`routeId` int NOT NULL,
	`flightNumber` varchar(12) NOT NULL,
	`scheduledDepartureTime` varchar(5),
	`scheduledArrivalTime` varchar(5),
	`estimatedDurationMinutes` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `flights_id` PRIMARY KEY(`id`),
	CONSTRAINT `flights_carrier_number_route_uq` UNIQUE(`carrierId`,`flightNumber`,`routeId`)
);
--> statement-breakpoint
CREATE TABLE `indexSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`calculationKey` varchar(160) NOT NULL,
	`scope` enum('route','national') NOT NULL,
	`routeId` int,
	`baselineDate` date NOT NULL,
	`asOfDate` date NOT NULL,
	`indexValue` decimal(12,4) NOT NULL,
	`priorIndexValue` decimal(12,4),
	`percentChange` decimal(10,4),
	`observationCount` int NOT NULL,
	`confidenceScore` decimal(5,2) NOT NULL,
	`calculationVersion` varchar(24) NOT NULL DEFAULT 'jevons-v1',
	`methodology` varchar(48) NOT NULL,
	`weights` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `indexSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `indices_calculation_key_uq` UNIQUE(`calculationKey`)
);
--> statement-breakpoint
CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originAirportId` int NOT NULL,
	`destinationAirportId` int NOT NULL,
	`distanceKm` decimal(9,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routes_id` PRIMARY KEY(`id`),
	CONSTRAINT `routes_airport_pair_uq` UNIQUE(`originAirportId`,`destinationAirportId`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','data_analyst','ingestion_worker','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `airports` ADD CONSTRAINT `airports_cityId_cities_id_fk` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anomalyRecords` ADD CONSTRAINT `anomalyRecords_fareObservationId_fareObservations_id_fk` FOREIGN KEY (`fareObservationId`) REFERENCES `fareObservations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `anomalyRecords` ADD CONSTRAINT `anomalyRecords_reviewedByUserId_users_id_fk` FOREIGN KEY (`reviewedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_originCityId_cities_id_fk` FOREIGN KEY (`originCityId`) REFERENCES `cities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_destinationCityId_cities_id_fk` FOREIGN KEY (`destinationCityId`) REFERENCES `cities`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_originAirportId_airports_id_fk` FOREIGN KEY (`originAirportId`) REFERENCES `airports`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_destinationAirportId_airports_id_fk` FOREIGN KEY (`destinationAirportId`) REFERENCES `airports`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_carrierId_carriers_id_fk` FOREIGN KEY (`carrierId`) REFERENCES `carriers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_flightId_flights_id_fk` FOREIGN KEY (`flightId`) REFERENCES `flights`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fareObservations` ADD CONSTRAINT `fareObservations_sourceId_dataSources_id_fk` FOREIGN KEY (`sourceId`) REFERENCES `dataSources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flights` ADD CONSTRAINT `flights_carrierId_carriers_id_fk` FOREIGN KEY (`carrierId`) REFERENCES `carriers`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `flights` ADD CONSTRAINT `flights_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `indexSnapshots` ADD CONSTRAINT `indexSnapshots_routeId_routes_id_fk` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_originAirportId_airports_id_fk` FOREIGN KEY (`originAirportId`) REFERENCES `airports`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_destinationAirportId_airports_id_fk` FOREIGN KEY (`destinationAirportId`) REFERENCES `airports`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `airports_city_idx` ON `airports` (`cityId`);--> statement-breakpoint
CREATE INDEX `anomalies_status_severity_idx` ON `anomalyRecords` (`reviewStatus`,`severity`);--> statement-breakpoint
CREATE INDEX `audit_actor_created_idx` ON `auditLogs` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `auditLogs` (`entityType`,`entityId`);--> statement-breakpoint
CREATE INDEX `fares_fingerprint_idx` ON `fareObservations` (`observationFingerprint`);--> statement-breakpoint
CREATE INDEX `fares_observation_idx` ON `fareObservations` (`observationAt`);--> statement-breakpoint
CREATE INDEX `fares_travel_date_idx` ON `fareObservations` (`travelDate`);--> statement-breakpoint
CREATE INDEX `fares_booking_date_idx` ON `fareObservations` (`bookingDate`);--> statement-breakpoint
CREATE INDEX `fares_route_travel_idx` ON `fareObservations` (`routeId`,`travelDate`);--> statement-breakpoint
CREATE INDEX `fares_route_carrier_travel_idx` ON `fareObservations` (`routeId`,`carrierId`,`travelDate`);--> statement-breakpoint
CREATE INDEX `fares_carrier_observed_idx` ON `fareObservations` (`carrierId`,`observationAt`);--> statement-breakpoint
CREATE INDEX `fares_source_idx` ON `fareObservations` (`sourceId`);--> statement-breakpoint
CREATE INDEX `fares_validation_idx` ON `fareObservations` (`validationStatus`);--> statement-breakpoint
CREATE INDEX `fares_anomaly_idx` ON `fareObservations` (`isAnomaly`);--> statement-breakpoint
CREATE INDEX `flights_route_idx` ON `flights` (`routeId`);--> statement-breakpoint
CREATE INDEX `indices_scope_date_idx` ON `indexSnapshots` (`scope`,`asOfDate`);--> statement-breakpoint
CREATE INDEX `indices_route_date_idx` ON `indexSnapshots` (`routeId`,`asOfDate`);--> statement-breakpoint
CREATE INDEX `routes_origin_destination_idx` ON `routes` (`originAirportId`,`destinationAirportId`);