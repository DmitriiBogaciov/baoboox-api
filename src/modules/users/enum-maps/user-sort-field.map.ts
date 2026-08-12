import { UserSortField } from "../enums";

export const UserSortFieldMap = {
    [UserSortField.CREATED_AT]: 'createdAt',
    [UserSortField.EMAIL]: 'email',
    [UserSortField.FIRST_NAME]: 'firstName',
    [UserSortField.LAST_NAME]: "lastName",
    [UserSortField.USERNAME]: "username"
}