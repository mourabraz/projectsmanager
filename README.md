# Backend in NestJS to Projects Manager App

## Description

- [] all users must be athenticated
- [] each user can create, update, delete groups created by hilmself (group's owner)
- [] each group can have several projects
- [] the owner can invite other users (participants) to the group, the participant must accept the invite
- [] the owner can delete an invitation before it has been accepted
- [] the owner can expel any participant. And the participants can leave any group.
- [] the owner can change the group's owner to another participant (the old owner becomes a participant)
- [] the onwer can delete a group and all data (projects) associated will be lost

- [] users (owner/participants of a group) can create, update, delete projects created by hilmself (projects's owner)
- [] when the owner of a project does not belong anymore to the related group the project's owner will be the group's owner
- [] each project can have several tasks

## API

## Routes

| Method | Path                       | Public | Description                                                                                         |
| :----: | :------------------------- | :----: | --------------------------------------------------------------------------------------------------- |
|  POST  | /auth/signup               |   Y    | register a new user                                                                                 |
|  GET   | /autj/signin               |   Y    | login                                                                                               |
|   -    | -                          |   -    | -                                                                                                   |
|  GET   | /groups                    |   N    | List all groups for the authenticated user (as onwer or participant)                                |
|  POST  | /groups                    |   N    | create a new group (the authenticated user as owner)                                                |
| PATCH  | /groups/:id                |   N    | update the group's name, the authenticated user must be the owner                                   |
| DELETE | /groups/:id                |   N    | delete a group. All associations to the group will be lost.                                         |
|   -    | -                          |   -    | -                                                                                                   |
|  GET   | /groups/:id/projects       |   N    | List all projects for a group                                                                       |
|  POST  | /groups/:id/projects       |   N    | create a new project in a group                                                                     |
|   -    | -                          |   -    | -                                                                                                   |
|  PUT   | /projects/:id              |   N    | update the title or description of a project (the authenticated must be the owner or a participant) |
| DELETE | /projects/:id              |   N    | delete a project                                                                                    |
|   -    | -                          |   -    | -                                                                                                   |
|  GET   | /groups/:id/invitations    |   N    | List all invitations for a group (only the owner)                                                   |
|  POST  | /groups/:id/invitations    |   N    | create a new invitation for a user to get into a group                                              |
|   -    | -                          |   -    | -                                                                                                   |
|  GET   | /invitations/accept/:token |   N    | update the invitation to mark as accepted                                                           |
| DELETE | /invitations/:id           |   N    | delete an invitation not accepted                                                                   |

## License

MIT © mourabraz@hotmail.com
