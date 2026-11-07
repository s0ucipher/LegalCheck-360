-- ============================================================================
-- Seed Data: Authentic Indian Legal Metrology Rules & Default Admin User
-- ============================================================================

-- Default Administrator & Inspector accounts
INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES 
(1, 'Lead Legal Auditor', 'admin@legalcheck360.in', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'admin'),
(2, 'Senior Metrology Inspector', 'inspector@legalcheck360.in', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 'inspector');

-- Seed Legal Rules
INSERT OR REPLACE INTO legal_rules (
    rule_id, rule_name, version, category, requirement, legal_reference, 
    applicable_conditions, exemptions, effective_from, source_url, verified_at, active_status
) VALUES
(
    'LMR-RULE-6-1-A',
    'Manufacturer / Packer / Importer Name & Complete Address',
    '2011.amended.2022',
    'all',
    'Every package shall bear the name and complete address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer; and for imported packages, the name and address of the importer.',
    'Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory for all pre-packaged commodities sold in India.',
    'Exemption applies only if package net weight is 10g/10ml or less, or for packages meant for fast food items packed by restaurant/hotel.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-1-B',
    'Generic or Common Name of the Commodity',
    '2011.amended.2022',
    'all',
    'The package shall clearly declare the common or generic name of the commodity contained in the package, or in the case of packages with more than one product, the name and number or quantity of each.',
    'Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory for all packaged commodities.',
    'None.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-1-C',
    'Net Quantity in Standard Metric Units',
    '2011.amended.2022',
    'all',
    'The package shall state the net quantity, in terms of standard unit of weight or measure (g, kg, ml, l, m, or count). Words like "Gross Weight" or non-standard non-metric units (lbs, oz) shall not be used alone.',
    'Rule 6(1)(c) read with Rule 12 & Rule 13, Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory for all packages except bulk agricultural commodities > 50 kg.',
    'Packages containing quantity less than 10 g or 10 ml if sold without packaging.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-1-D',
    'Month and Year of Manufacture / Pre-packing / Import',
    '2011.amended.2022',
    'all',
    'Every package shall mention the month and year in which the commodity is manufactured or pre-packed or imported. For commodities having limited shelf life, "Best Before" or "Use By" date must also be declared.',
    'Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory for all consumer packaged goods.',
    'Packages of bidi or incense sticks or domestic LPG cylinders exempted.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-1-E',
    'Maximum Retail Price (MRP) Inclusive of All Taxes',
    '2011.amended.2022',
    'all',
    'The retail sale price of the package shall be clearly stated as "Maximum or Max. Retail Price Rs. .... or ₹.... inclusive of all taxes" or "MRP Rs./₹ .... incl. of all taxes". No separate tax may be collected above this price.',
    'Rule 6(1)(da) / Rule 6(1)(e), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory for all retail packages.',
    'Export packages or packages meant for institutional consumers / industrial consumers.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-1-N',
    'Consumer Care / Grievance Redressal Details',
    '2011.amended.2022',
    'all',
    'Every package shall bear the name, complete address, telephone number, and e-mail address of the person or office that can be contacted by the consumer in case of a complaint or query.',
    'Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory across all product categories sold in India.',
    'None.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-10',
    'Country of Origin Declaration',
    '2020.amendment',
    'all',
    'Every package containing an imported commodity shall clearly declare the name of the country of origin or manufacture on the principal display panel.',
    'Rule 6(10) / Notification G.S.R. 529(E), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Mandatory for imported products; strongly recommended on all retail consumer goods.',
    'Indigenously manufactured commodities where manufacturer address clearly specifies State and Country (India).',
    '2020-01-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-6-1-USP',
    'Unit Sale Price Declaration',
    '2021.amendment.2022',
    'all',
    'For packages containing net quantity more than 1 kg or 1 litre, the unit sale price shall be declared in terms of Rs./₹ per kg or per litre. For packages less than 1 kg or 1 litre, in terms of per 100g or per 100ml.',
    'Rule 6(1)(11) amended via G.S.R. 779(E), Legal Metrology (Packaged Commodities) Rules, 2011',
    'Applicable when package weight exceeds specified thresholds.',
    'Packages where retail sale price equals unit sale price or net quantity is exactly 1 unit.',
    '2022-12-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
),
(
    'LMR-RULE-FOOD-SAFETY',
    'Best Before / Expiry Date & FSSAI Declarations for Packaged Food',
    '2011.amended.2022',
    'packaged_food',
    'Pre-packaged food commodities must prominently display the "Best Before" date or "Expiry Date" along with nutritional facts and FSSAI license number on the principal display panel.',
    'Rule 6(1)(d) proviso read with FSSAI Regulations & PCR 2011',
    'Mandatory for packaged food, snacks, confectionery, dairy and beverages.',
    'Non-food consumer commodities.',
    '2011-03-01',
    'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    '2026-01-15',
    1
);

