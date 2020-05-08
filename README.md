# Backend in NestJS to Projects Manager App

## Description

- all users must be athenticated
- each user can create, update, delete groups created by hilmself (group's owner)
- each group can have several projects
- the owner can invite other users (participants) to the group, the participant must accept the invite
- the owner can delete an invitation before it has been accepted
- the owner can expel any participant. And the participants can leave any group.
- the owner can change the group's owner to another participant (the old owner becomes a participant)
- the onwer can delete a group and all data (projects) associated will be lost
- users (owner/participants of a group) can create, update, delete projects created by hilmself (projects's owner)
- when the owner of a project does not belong anymore to the related group the project's owner will be the group's owner
- each project can have several tasks

## API

## Routes

| Method | Path                    | Public | Description                                                                                         | Tests              |
| :----: | :---------------------- | :----: | --------------------------------------------------------------------------------------------------- | ------------------ |
|  POST  | /auth/signup            |   Y    | register a new user                                                                                 | :heavy_check_mark: |
|  GET   | /autj/signin            |   Y    | login                                                                                               | :heavy_check_mark: |
|   -    | -                       |   -    | -                                                                                                   | -                  |
|  GET   | /groups                 |   N    | List all groups for the authenticated user (as onwer or participant)                                | :heavy_check_mark: |
|  POST  | /groups                 |   N    | create a new group (the authenticated user as owner)                                                | :heavy_check_mark: |
| PATCH  | /groups/:id             |   N    | update the group's name, the authenticated user must be the owner                                   | :heavy_check_mark: |
| DELETE | /groups/:id             |   N    | delete a group. All associations to the group will be lost.                                         | :heavy_check_mark: |
|   -    | -                       |   -    | -                                                                                                   | -                  |
|  GET   | /groups/:id/projects    |   N    | List all projects for a group                                                                       | :heavy_check_mark: |
|  POST  | /groups/:id/projects    |   N    | create a new project in a group                                                                     | :heavy_check_mark: |
|   -    | -                       |   -    | -                                                                                                   | -                  |
|  PUT   | /projects/:id           |   N    | update the title or description of a project (the authenticated must be the owner or a participant) | :heavy_check_mark: |
| DELETE | /projects/:id           |   N    | delete a project                                                                                    | :heavy_check_mark: |
|   -    | -                       |   -    | -                                                                                                   | -                  |
|  GET   | /groups/:id/invitations |   N    | List all invitations for a group (only the owner)                                                   | :heavy_check_mark: |
|  POST  | /groups/:id/invitations |   N    | create a new invitation for a user to get into a group                                              | :heavy_check_mark: |
|   -    | -                       |   -    | -                                                                                                   | -                  |
| PATCH  | /invitations/:id        |   N    | update the invitation to mark as accepted                                                           | :thumbsdown:       |
| DELETE | /invitations/:id        |   N    | delete an invitation not accepted                                                                   | :thumbsdown:       |

## Test

This project is focused on integration tests.
We performing the test sequentially, in order to do not mock the Database (Postgres).

## Emails

- Every new user (sign up) a welcome email will be sent
- When a new invitation is created an email is sent to the participant

All emails are added to a queue using [Redis](https://redis.io/) and [Bull](https://github.com/OptimalBits/bull#readme). The execution of the job will run in another process (different of the main app), to accomplish this feature we use the WebSocket feature to provide the communication between the main app and the Bull execution environment.

For the templates of the email, we use the [handlebars](https://handlebarsjs.com/)

For a more simple example see this repo: [nestjs-queue-email-example](https://github.com/mourabraz/nestjs-queue-email-example)

## License

MIT © mourabraz@hotmail.com
