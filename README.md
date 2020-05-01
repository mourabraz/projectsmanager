# Backend in NestJS to Projects Manager App

## Description

- [] all users must be athenticated
- [] each user can create, update, delete groups created by hilmself (group's owner)
- [] each group can have several projects
- [] the owner can invite other users (participants) to the group, the participant must accept the invite
- [] each project can have several tasks
- [] the owner can change the group's owner to another participant (the old owner becomes a participant)

## API

## Routes

| Method | Path                 | Public | description                                                          |
| :----: | :------------------- | :----: | -------------------------------------------------------------------- |
|  POST  | /auth/signup         |   Y    | register a new user                                                  |
|  GET   | /autj/signin         |   Y    | login                                                                |
|   -    | -                    |   -    | -                                                                    |
|  GET   | /groups              |   N    | List all groups for the authenticated user (as onwer or participant) |
|  POST  | /groups              |   N    | create a new group (the authenticated user as owner)                 |
| PATCH  | /groups/:id          |   N    | update the group's name, the authenticated user must be the owner    |
| DELETE | /groups/:id          |   N    | delete a group. All associations to the group will be lost.          |
|   -    | -                    |   -    | -                                                                    |
|  GET   | /groups/:id/projects |   N    | List all projects for a group                                        |
|  POST  | /groups/:id/projects |   N    | create a new project in a group                                      |
|   -    | -                    |   -    | -                                                                    |
| PATCH  | /projects/:id        |   N    | update the name of a project                                         |
| DELETE | /projects/:id        |   N    | delete a project                                                     |

## License

MIT © mourabraz@hotmail.com
