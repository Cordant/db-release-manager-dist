export declare const mainHelp = "### This is application manager ###\nThis cli provides certain help for you projects.\n\nThe usual command syntax is\nam <sub type> <action> [--options]\n\nwith sub type being :\n    --database (-db) actions relative to database files\n    --middle-tier (-m) actions relative to middle tier\n    --frontend (-f) actions relative to the front end\n    --repo (-r) repository related actions\n    --clear (-c) clear the cache\n    --server (-s) server actions\n\nPlease run am <sub type> help to learn more about one of those";
export declare const databaseHelp = "## Databasae manager ##\nActions\n    init (n) inits a database code\n    install (i) installs a database version, or all its versions\n    create-table (ct) creates a table \n    new-version (nv) creates a new version\n    check-version (cv) checks the version covers all the files in the verison\n    generate-functions (gf) generates the functions relative to the tables in the repository\n    edit-object (e) edits the object passed as parameter\n    add-template (t) adds a predefined template\n    tag (#) adds a tag on a table or a table field\n    replication-from (rf) sets up a replication routine to replicate the desired table\n    replication-to (rt) sets up a replication routine to get the desired table replicated\n    check-code (c) checks the code. Makes sure that object(tables and functions) are in files that reflect their actual names\n\nParameters\n    --environment (e) Environment\n    --application-name (a) Application Name\n    --object-name (o) Object Name\n    --object-type (y) Object Type\n    --remove (r) Remove tag\n    --value (u) Value\n    --filter (f) field / regex filter to apply to the commands\n    --version (-v) the version to change\n    --source-database (-d) source database for replications\n    --params (-p) the parameters to use for the actions";
