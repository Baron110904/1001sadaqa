-- FedaPay devient le seul agregateur de paiement.
--
-- Le reglage n'offrait qu'un choix entre trois fournisseurs dont un seul sera
-- utilise. La ligne est retiree : les reglages presents en base sont ce que le
-- back-office affiche, un orphelin y resterait donc visible et modifiable.
DELETE FROM "settings" WHERE "key" = 'payment.provider';
