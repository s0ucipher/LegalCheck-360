# LegalCheck 360: Indian Legal Metrology Statutory References

**Project Name:** LegalCheck 360  
**Tagline:** Smart Packaging. Smarter Compliance.  
**Governing Authority:** Ministry of Consumer Affairs, Food and Public Distribution, Government of India  
**Primary Legislation:** Legal Metrology Act, 2009 (Act No. 1 of 2010)  
**Primary Subordinate Legislation:** Legal Metrology (Packaged Commodities) Rules, 2011 (as amended)

---

## 1. Statutory Foundations of Packaged Commodities in India

Under Section 18 of the **Legal Metrology Act, 2009**, no person shall manufacture, pack, sell, distribute, deliver, offer, expose or possess for sale by retail or wholesale any pre-packaged commodity unless such package is in such standard quantities or number and bears thereon such declarations and particulars in such manner as may be prescribed.

The specific mandatory declarations are codified under **Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011** (G.S.R. 202(E) dated 7th March, 2011).

---

## 2. Rule-by-Rule Statutory Audit Matrix

| Rule Identifier | Statutory Provision | Legal Requirement | Enforcement Criteria in LegalCheck 360 |
| :--- | :--- | :--- | :--- |
| **LMR-RULE-6-1-A** | Rule 6(1)(a) | Name and complete physical address of the manufacturer, or where manufacturer is not the packer, name and address of manufacturer and packer; and for imported packages, the name and address of the importer. | Pass if legal entity name + street address/locality + PIN code are extracted. Unclear if only brand name without physical address. |
| **LMR-RULE-6-1-B** | Rule 6(1)(b) | Generic or common name of the commodity contained in the package. | Pass if generic trade name is legible on Principal Display Panel (PDP). |
| **LMR-RULE-6-1-C** | Rule 6(1)(c) read with Rule 12 & 13 | Net quantity in terms of standard unit of weight or measure (g, kg, ml, l, m, count). | Pass if standard metric SI unit is used. **FAIL** if non-metric units (lbs, oz, stones) are used alone. |
| **LMR-RULE-6-1-D** | Rule 6(1)(d) | Month and year in which commodity is manufactured, pre-packed, or imported (or Best Before / Expiry date). | Pass if MM/YYYY or DD/MM/YYYY date is legible. |
| **LMR-RULE-6-1-E** | Rule 6(1)(da) / (e) | Maximum Retail Price (MRP) inclusive of all taxes in Indian Rupees (₹ or Rs.). | Pass if numeric MRP in INR is declared with "inclusive of all taxes". **FAIL** if taxes are extra or MRP is absent. |
| **LMR-RULE-6-1-N** | Rule 6(1)(n) | Name, address, telephone number, and e-mail address of the person/office to be contacted by consumer in case of complaint. | Pass if customer helpline telephone number, email address, or grievance cell address is declared. |
| **LMR-RULE-6-10** | Rule 6(10) / G.S.R. 529(E) | Name of the country of origin or manufacture for imported commodities or e-commerce pre-packaged goods. | Pass if Country of Origin is declared, or domestic manufacture within India is confirmed via address. |
| **LMR-RULE-6-1-USP** | Rule 6(1)(11) / G.S.R. 779(E) | Unit Sale Price (USP) declared in terms of Rs./kg or Rs./litre for packages > 1kg/1L; and Rs./100g or Rs./100ml for packages < 1kg/1L. | Pass if Unit Sale Price is declared; Not Applicable if retail package is single standard unit. |
| **LMR-RULE-FOOD-SAFETY** | Rule 6(1)(d) proviso read with FSSAI | Pre-packaged food commodities must prominently display Best Before / Expiry Date and FSSAI License Number. | Evaluated for `packaged_food` and `beverages` categories. |

---

## 3. Statutory Exemptions Handled by the Engine

Under **Rule 26 of the Legal Metrology (Packaged Commodities) Rules, 2011**, exemptions apply to:
1. Packages containing quantities of **less than 10 grams or 10 milliliters** sold without packaging.
2. Fast food items packed by restaurant or hotel at the request of the consumer.
3. Agricultural produce packages exceeding **50 kilograms**.
4. Packages intended specifically for export outside the territory of India.

The LegalCheck 360 C rules engine accounts for these thresholds during rule evaluation.

