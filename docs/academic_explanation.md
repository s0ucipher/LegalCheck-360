# LegalCheck 360: Academic Guide & Code Walkthrough

**Audience:** First-Year B.Tech Computer Science & Engineering (CSE) Students  
**Subject:** Full-Stack Application Architecture with C Backend  
**Application:** LegalCheck 360 ("Smart Packaging. Smarter Compliance.")

---

## 1. Fundamental C Programming Concepts Demonstrated

In a traditional first-year CSE curriculum, students learn procedural programming in C. LegalCheck 360 demonstrates how those foundational concepts build an enterprise regulatory inspection platform:

### A. Structures and Typedefs (`typedef struct`)
- **File:** `backend/src/models/product.h`
- **Explanation:** In C, a `struct` groups related variables of different data types under a single name. Instead of passing dozens of loose variables (product name, MRP, net quantity, status), we encapsulate them into `ScanRecord`, `ExtractedField`, `LegalRule`, and `ComplianceResult`.
- **Viva Answer:** *"A struct allows us to model a real-world packaging inspection entity with heterogeneous data attributes such as strings, floating-point confidence values, and integer IDs in contiguous memory."*

### B. Enums (`enum`)
- **File:** `backend/src/models/product.h`
- **Definition:** `typedef enum { COMPLIANCE_PASS = 0, COMPLIANCE_FAIL, COMPLIANCE_UNCLEAR, COMPLIANCE_NOT_APPLICABLE } ComplianceStatus;`
- **Viva Answer:** *"Enums provide type-safe named integral constants representing discrete compliance states, preventing invalid status values and improving code readability."*

### C. Pointers and Pass-by-Reference
- **Functions:** `rules_engine_evaluate_scan(ScanRecord *scan)`, `db_get_scan(const char *id, ScanRecord *out_scan)`
- **Explanation:** Passing large structs by value would copy hundreds of bytes onto the stack on every function call. By passing a pointer (`ScanRecord *`), only 8 bytes (the memory address) are passed, allowing the function to modify the caller's struct directly with maximum efficiency.

### D. File I/O and Magic Byte Inspection
- **File:** `backend/src/utils/file_validation.c`
- **Explanation:** Functions `fopen(..., "rb")` and `fread(...)` read raw binary bytes. We examine the first few bytes ("magic numbers") to verify file authenticity:
  - JPEG starts with `0xFF 0xD8 0xFF`
  - PNG starts with `0x89 0x50 0x4E 0x47`
- **Viva Answer:** *"We validate the binary file signature rather than just relying on the file extension (.jpg/.png), protecting the server against malicious file disguise attacks."*

### E. Modular Programming & Header Guards
- **Technique:** `#ifndef FILENAME_H`, `#define FILENAME_H`, `#endif`
- **Explanation:** Header guards prevent recursive inclusion errors when multiple source files include common headers like `product.h` and `error_handler.h`.

### F. Dynamic Memory Management (`malloc` & `free`)
- **File:** `backend/src/services/ai_service.c` and `backend/src/utils/json_utils.c`
- **Explanation:** Curl response buffers and Base64 decoded image buffers have variable sizes. We allocate memory on the heap using `malloc()` / `realloc()` and ensure every buffer is released with `free()` to prevent memory leaks.

---

## 2. Walkthrough of the C Rules Engine

The core decision-making logic is implemented in `backend/src/rules/rules_engine.c`.

When `rules_engine_evaluate_scan(ScanRecord *scan)` is invoked:
1. It queries SQLite for all active legal rules governing the product's category.
2. For Rule 6(1)(da) (MRP): It looks up the extracted `mrp` field. It checks that the numeric value > 0 and verifies the presence of the phrase *"inclusive of all taxes"*.
3. For Rule 6(1)(c) (Net Quantity): It verifies that standard SI metric units (`g`, `kg`, `ml`, `l`) are used. If non-metric units (`lbs`, `oz`) are used alone, it immediately triggers a **FAIL**.
4. For Rule 6(1)(a) (Manufacturer): It checks that the legal entity name and complete physical address with postal PIN code are declared.
5. If required declarations are missing across multiple photos, it marks the rule as **FAIL**. If only one photograph was uploaded or text was blurry, it marks the status as **UNCLEAR (REVIEW_REQUIRED)** rather than falsely declaring a violation.

---

## 3. How to Answer Common Viva Questions

### Q1: "Why did you build the backend in C instead of Python or Node.js?"
**Answer:**
> *"C provides maximum execution speed, zero memory bloat, deterministic behavior, and teaches fundamental computer systems engineering — including pointers, memory management, and binary protocols. Embedded servers in C can handle thousands of requests per second on minimal hardware."*

### Q2: "What role does AI play versus the C backend?"
**Answer:**
> *"AI is used strictly as an optical perception assistant to transcribe complex packaging text into structured JSON. AI is NEVER permitted to decide if a product complies with Indian law. The legal compliance decision is strictly evaluated by our deterministic C rules engine."*

### Q3: "What happens if there is no internet connection?"
**Answer:**
> *"LegalCheck 360 has a built-in offline fallback engine in C that parses OCR text streams using high-precision regex and packaging keyword heuristics, ensuring 100% functionality without internet."*

