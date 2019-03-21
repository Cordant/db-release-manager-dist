create table <db>t_version_ver (
    pk_ver_id serial primary key,
    ver_name text UNIQUE not null,
    ver_content json null,
    created_by CHAR(4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_by CHAR(4) NOT NULL,
    modified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);