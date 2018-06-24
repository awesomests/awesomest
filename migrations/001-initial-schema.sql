-- Up

create table if not exists Category (
  id integer primary key AUTOINCREMENT,
  name varchar(255) not null unique  
);

create table if not exists Link (
  id integer primary key AUTOINCREMENT,
  label varchar(255) null,
  url text not null unique,
  description text null
);

-- create table if not exists CategoryLink (
--   id integer primary key AUTOINCREMENT,
--   categoryId integer not null,
--   linkId integer not null,
  
--   foreign key (linkId) references Link (id)
--     on update cascade on delete cascade,

--   foreign key (categoryId) references Category (id)
--     on update cascade on delete cascade
-- );

create table if not exists User (
  id integer primary key AUTOINCREMENT,
  email varchar(255) not null unique,
  name varchar(255) not null
);

create table if not exists List (
  owner varchar(255) not null,
  name varchar(255) not null,
  -- userId varchar(255) not null,
  categoryId varchar(255) not null,
  primary key (owner, name),

  foreign key (categoryId) references Category (id)
    on update cascade on delete cascade

  -- foreign key (userId) references User (id)
  --   on update cascade on delete cascade
);

create table if not exists GitCommit (
  sha varchar(255) not null primary key,
  userId integer not null,
  listOwner varchar(255) not null,
  listName varchar(255) not null,
  summary text not null,
  message text,
  createdAt datetime,

  foreign key (userId) references User (id)
    on update cascade on delete cascade,

  foreign key (listOwner, listName) references List (owner, name)
    on update cascade on delete cascade
);

create table if not exists ListLink (
  linkId integer not null,
  listOwner varchar(255) not null,
  listName varchar(255) not null,
  userId integer not null,
  commitSha varchar(255) not null,
  active boolean not null default true,
  primary key (linkId, listName, listOwner),

  foreign key (linkId) references Link (id)
    on update cascade on delete cascade,

  foreign key (listOwner, listName) references List (owner, name)
    on update cascade on delete cascade,

  foreign key (userId) references User (id)
    on update cascade on delete cascade,

  foreign key (commitSha) references GitCommit (sha)
    on update cascade on delete cascade
);

-- Down

drop table if exists Category;
drop table if exists Link;
-- drop table if exists CategoryLink;
drop table if exists User;
drop table if exists List;
drop table if exists ListLink;
drop table if exists GitCommit;