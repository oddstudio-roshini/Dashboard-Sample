-- Auto-created schema — runs on every startup via spring.sql.init.mode=always
-- All statements use IF NOT EXISTS so they are safe to run repeatedly.

CREATE TABLE IF NOT EXISTS doctors (
    id                      BIGSERIAL PRIMARY KEY,
    clinical_id             VARCHAR(255) NOT NULL UNIQUE,
    first_name              VARCHAR(255) NOT NULL,
    last_name               VARCHAR(255) NOT NULL,
    birth_year              INTEGER,
    username                VARCHAR(255) NOT NULL UNIQUE,
    temporary_password      VARCHAR(255) NOT NULL,
    password                VARCHAR(255) NOT NULL DEFAULT '',
    email                   VARCHAR(255) NOT NULL UNIQUE,
    mobile_number           VARCHAR(50),
    specialization          VARCHAR(255),
    clinic_hospital         VARCHAR(255),
    is_online               BOOLEAN      NOT NULL DEFAULT FALSE,
    status                  VARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
    notes                   TEXT,
    require_password_change BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login              TIMESTAMP,
    last_logout             TIMESTAMP,
    is_suspended            BOOLEAN      NOT NULL DEFAULT FALSE,
    device                  VARCHAR(255),
    fps                     VARCHAR(50),
    created_at              TIMESTAMP             DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_password_tokens (
    id         BIGSERIAL PRIMARY KEY,
    doctor_id  BIGINT      NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP   NOT NULL,
    used       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP            DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctor_logs (
    id           BIGSERIAL PRIMARY KEY,
    doctor_id    BIGINT       REFERENCES doctors(id) ON DELETE SET NULL,
    doctor_name  VARCHAR(255),
    description  TEXT,
    action       VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255),
    clinic       VARCHAR(255),
    ip_address   VARCHAR(100),
    device       VARCHAR(255),
    notes        TEXT,
    timestamp    TIMESTAMP    NOT NULL DEFAULT NOW()
);
