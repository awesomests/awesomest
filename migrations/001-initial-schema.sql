-- Up

create table if not exists Category (
  id integer primary key AUTOINCREMENT,
  name varchar(255) not null unique  
);

create table if not exists Link (
  id integer primary key AUTOINCREMENT,
  label varchar(255) not null,
  url text not null unique,
  description text null
);

create table if not exists CategoryLink (
  id integer primary key AUTOINCREMENT,
  categoryId integer not null,
  linkId integer not null,
  
  foreign key (linkId) references Link (id)
    on update cascade on delete cascade,

  foreign key (categoryId) references Category (id)
    on update cascade on delete cascade
);

create table if not exists User (
  id integer primary key AUTOINCREMENT,
  email varchar(255) not null unique,
  name varchar(255) not null
);

create table if not exists Repository (
  name varchar(255) not null,
  owner varchar(255) not null,
  userId varchar(255) not null,
  primary key (name, owner),

  foreign key (userId) references User (id)
    on update cascade on delete cascade
);

create table if not exists GitCommit (
  sha varchar(255) not null primary key,
  userId integer not null,
  repositoryName varchar(255) not null,
  repositoryOwner varchar(255) not null,
  summary text not null,
  message text,
  createdAt datetime,

  foreign key (userId) references User (id)
    on update cascade on delete cascade,

  foreign key (repositoryName, repositoryOwner) references Repository (name, owner)
    on update cascade on delete cascade
);

create table if not exists RepositoryLink (
  linkId integer not null,
  repositoryName varchar(255) not null,
  repositoryOwner varchar(255) not null,
  userId integer not null,
  active boolean not null default true,
  primary key (linkId, repositoryName, repositoryOwner),

  foreign key (linkId) references Link (id)
    on update cascade on delete cascade,

  foreign key (repositoryName, repositoryOwner) references Repository (name, owner)
    on update cascade on delete cascade,

  foreign key (userId) references User (id)
    on update cascade on delete cascade
);

-- Down

drop table if exists Category;
drop table if exists Link;
drop table if exists CategoryLink;
drop table if exists User;
drop table if exists Repository;
drop table if exists RepositoryLink;
drop table if exists GitCommit;