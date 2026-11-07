# ============================================================================
# LegalCheck 360: Master Build Makefile
# "Smart Packaging. Smarter Compliance."
# ============================================================================

CC ?= clang
CFLAGS = -Wall -Wextra -O2 -std=c11 -I./backend/src -I./backend/lib
LDFLAGS = -lsqlite3 -lcurl -lpthread

# Directories
SRC_DIR = backend/src
LIB_DIR = backend/lib
BUILD_DIR = build
BIN = legalcheck360_server

# Source files
SRCS = $(LIB_DIR)/mongoose.c \
       $(LIB_DIR)/cJSON.c \
       $(SRC_DIR)/utils/file_validation.c \
       $(SRC_DIR)/utils/json_utils.c \
       $(SRC_DIR)/utils/error_handler.c \
       $(SRC_DIR)/database/database.c \
       $(SRC_DIR)/services/ocr_service.c \
       $(SRC_DIR)/services/ai_service.c \
       $(SRC_DIR)/services/pdf_generator.c \
       $(SRC_DIR)/rules/rules_engine.c \
       $(SRC_DIR)/routes/dashboard_routes.c \
       $(SRC_DIR)/routes/rule_routes.c \
       $(SRC_DIR)/routes/review_routes.c \
       $(SRC_DIR)/routes/scan_routes.c \
       $(SRC_DIR)/server.c \
       $(SRC_DIR)/main.c

OBJS = $(SRCS:%.c=$(BUILD_DIR)/%.o)

.PHONY: all run clean test dirs sync-static

all: dirs sync-static $(BIN)

sync-static:
	@cp -f frontend/*.html . 2>/dev/null || true
	@cp -rf frontend/css frontend/js frontend/assets . 2>/dev/null || true

dirs:
	@mkdir -p $(BUILD_DIR)/$(LIB_DIR)
	@mkdir -p $(BUILD_DIR)/$(SRC_DIR)/utils
	@mkdir -p $(BUILD_DIR)/$(SRC_DIR)/database
	@mkdir -p $(BUILD_DIR)/$(SRC_DIR)/services
	@mkdir -p $(BUILD_DIR)/$(SRC_DIR)/rules
	@mkdir -p $(BUILD_DIR)/$(SRC_DIR)/routes
	@mkdir -p backend/uploads backend/reports database

$(BIN): $(OBJS)
	@echo "==> Linking LegalCheck 360 C Core Server..."
	$(CC) $(OBJS) $(LDFLAGS) -o $(BIN)
	@echo "==> Build successful: ./$(BIN)"

$(BUILD_DIR)/%.o: %.c
	@mkdir -p $(dir $@)
	$(CC) $(CFLAGS) -c $< -o $@

run: all
	@echo "==> Starting LegalCheck 360 Server..."
	./$(BIN) 8080

test: dirs
	@echo "==> Compiling unit tests..."
	$(CC) $(CFLAGS) \
		$(LIB_DIR)/cJSON.c \
		$(SRC_DIR)/utils/file_validation.c \
		$(SRC_DIR)/utils/json_utils.c \
		$(SRC_DIR)/utils/error_handler.c \
		$(SRC_DIR)/database/database.c \
		$(SRC_DIR)/rules/rules_engine.c \
		$(SRC_DIR)/services/pdf_generator.c \
		tests/test_compliance.c \
		$(LDFLAGS) -o build/test_compliance
	$(CC) $(CFLAGS) \
		$(LIB_DIR)/cJSON.c \
		$(SRC_DIR)/utils/file_validation.c \
		$(SRC_DIR)/utils/json_utils.c \
		$(SRC_DIR)/utils/error_handler.c \
		$(SRC_DIR)/services/ai_service.c \
		tests/test_extraction.c \
		$(LDFLAGS) -o build/test_extraction
	$(CC) $(CFLAGS) \
		$(SRC_DIR)/utils/file_validation.c \
		$(SRC_DIR)/utils/error_handler.c \
		$(SRC_DIR)/services/ocr_service.c \
		tests/test_ocr.c \
		$(LDFLAGS) -o build/test_ocr
	@echo "==> [Suite 1/3] Running Legal Metrology Compliance Tests..."
	./build/test_compliance
	@echo "==> [Suite 2/3] Running Declarations Extraction Tests..."
	./build/test_extraction
	@echo "==> [Suite 3/3] Running OCR & File Security Tests..."
	./build/test_ocr
	@echo "==> ALL 3 TEST SUITES PASSED CLEANLY!"

clean:
	@echo "==> Cleaning build artifacts..."
	rm -rf $(BUILD_DIR) $(BIN) build/test_*

