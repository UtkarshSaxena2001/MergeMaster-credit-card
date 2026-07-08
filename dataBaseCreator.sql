CREATE TABLE customer (
    customer_id NUMBER(7) GENERATED ALWAYS AS IDENTITY,
    customer_name VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL,
    mobile_number VARCHAR2(15) NOT NULL,
    pan_number VARCHAR2(10) NOT NULL,

    CONSTRAINT pk_customer PRIMARY KEY (customer_id),
    CONSTRAINT uk_customer_email UNIQUE (email),
    CONSTRAINT uk_customer_mobile UNIQUE (mobile_number),
    CONSTRAINT uk_customer_pan UNIQUE (pan_number)
);

CREATE TABLE credit_card (
    card_number VARCHAR2(16),
    customer_id NUMBER(7) NOT NULL,
    card_type VARCHAR2(20) NOT NULL,
    credit_limit NUMBER(12,2) NOT NULL,
    available_credit NUMBER(12,2) NOT NULL,
    outstanding_amount NUMBER(12,2) DEFAULT 0 NOT NULL,
    expiry_date DATE NOT NULL,
    card_status VARCHAR2(20) DEFAULT 'ACTIVE' NOT NULL,

    CONSTRAINT pk_credit_card PRIMARY KEY (card_number),
    CONSTRAINT fk_card_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id),
    CONSTRAINT chk_card_type CHECK (card_type IN ('SILVER', 'GOLD', 'PLATINUM')),
    CONSTRAINT chk_card_status CHECK (card_status IN ('ACTIVE', 'BLOCKED')),
    CONSTRAINT chk_credit_limit CHECK (credit_limit > 0),
    CONSTRAINT chk_available_credit CHECK (available_credit >= 0),
    CONSTRAINT chk_outstanding_amount CHECK (outstanding_amount >= 0)
);

CREATE TABLE merchant (
    merchant_id NUMBER(7) GENERATED ALWAYS AS IDENTITY,
    merchant_name VARCHAR2(100) NOT NULL,
    category VARCHAR2(50) NOT NULL,
    location VARCHAR2(100),

    CONSTRAINT pk_merchant PRIMARY KEY (merchant_id)
);

CREATE TABLE transactions (
    transaction_id NUMBER(10) GENERATED ALWAYS AS IDENTITY,
    card_number VARCHAR2(16) NOT NULL,
    transaction_type VARCHAR2(20) NOT NULL,
    amount NUMBER(12,2) NOT NULL,
    merchant_id NUMBER(7),
    transaction_date_time TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    status VARCHAR2(20) NOT NULL,
    failure_reason VARCHAR2(255),

    CONSTRAINT pk_transactions PRIMARY KEY (transaction_id),
    CONSTRAINT fk_transaction_card FOREIGN KEY (card_number) REFERENCES credit_card(card_number),
    CONSTRAINT fk_transaction_merchant FOREIGN KEY (merchant_id) REFERENCES merchant(merchant_id),
    CONSTRAINT chk_transaction_type CHECK (transaction_type IN ('PURCHASE', 'PAYMENT')),
    CONSTRAINT chk_transaction_status CHECK (status IN ('SUCCESS', 'FAILED')),
    CONSTRAINT chk_transaction_amount CHECK (amount > 0),
    CONSTRAINT chk_purchase_merchant CHECK (
        (transaction_type = 'PURCHASE' AND merchant_id IS NOT NULL)
        OR
        (transaction_type = 'PAYMENT' AND merchant_id IS NULL)
    )
);