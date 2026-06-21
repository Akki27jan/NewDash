# Database Schema

Here is the current database structure based on the models defined in the backend application.

## users -:
| `id` | String | Primary Key, Indexed |
| `first_name` | String | Not Null |
| `last_name` | String | Not Null |
| `email` | String | Unique, Indexed, Not Null |
| `hashed_password` | String | Not Null |
| `created_at` | DateTime | Default: Current Timestamp (`func.now()`) |

## subjects -:
| `id` | String | Primary Key, Indexed |
| `student_id` | String | Foreign Key (`users.id`), Not Null, Indexed |
| `subject_name` | String | Not Null |
| `credits` | Float | Not Null |
| `description` | String | Nullable |

## to-do -:
| `id` | String | Primary Key, Indexed |
| `student_id` | String | Foreign Key (`users.id`), Not Null, Indexed |
| `subject_id` | String | Foreign Key (`subjects.id`), Not Null, Indexed |
| `task_name` | String | Not Null |
| `status` | Bool | Not Null |
| `due` | DateTime | Not Null |
| `priority` | enum ('Low','Medium','High') | Not Null |

## sub_tasks -:
| `id` | String | Primary Key, Indexed |
| `task_id` | String | Foreign Key (`to-do.id`), Not Null, Indexed |
| `sub_task_name` | String | Not Null |
| `priority` | enum ('Low','Medium','High') | Not Null |
| `due` | DateTime | Not Null |
| `status` | Bool | Not Null |

## Notes -:
| `id` | String | Primary Key, Indexed |
| `subject_id` | String | Foreign Key (`subjects.id`), Not Null, Indexed |
| `note_name` | String | Not Null |
| `note_link` | String | Not Null |
| `note_type` | String | Not Null |
| `created_at` | DateTime | Default: Current Timestamp (`func.now()`) |
