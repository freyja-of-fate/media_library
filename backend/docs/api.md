# Media Library API Documentation

## Overview

The Media Library API provides endpoints for:

* User authentication and account management
* Two-factor authentication (TOTP)
* Media management
* Character management
* Media-character relationships
* User media libraries
* Search and autocomplete functionality

## Base URL

```http
https://<your_ip>/api
```

## Authentication

Protected endpoints require a JWT access token.

```http
Authorization: Bearer <token>
```

---

# Error Responses

All endpoints may return:

```json
{
  "error": "Error message"
}
```

Common status codes:

| Status | Meaning          |
| ------ | ---------------- |
| 200    | Success          |
| 201    | Created          |
| 204    | Deleted          |
| 400    | Validation Error |
| 401    | Unauthorized     |
| 403    | Forbidden        |
| 404    | Not Found        |
| 409    | Conflict         |
| 500    | Server Error     |

---

# Users

## Register

Create a new user account.

### Request

```http
POST /users/register
```

### Body

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### Response

```json
{
  "message": "User registered successfully",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

---

## Login

### Request

```http
POST /users/login
```

### Body

```json
{
  "username": "testuser",
  "password": "password123"
}
```

### Success Response

```json
{
  "type": "success",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

### 2FA Challenge Response

```json
{
  "type": "challenge",
  "requires_2fa": true,
  "method": "totp",
  "challenge_token": "challenge-token"
}
```

---

## Complete TOTP Login

### Request

```http
POST /users/login/totp
```

### Body

```json
{
  "challenge_token": "token",
  "code": "123456"
}
```

---

## Get Current Profile

### Request

```http
GET /users/profile
```

### Authentication

Required

---

## Update Profile

### Request

```http
PATCH /users/profile
```

### Body

```json
{
  "username": "newname"
}
```

or

```json
{
  "currentPassword": "old",
  "newPassword": "new"
}
```

---

## Delete Current User

### Request

```http
DELETE /users
```

---

## List Users

### Request

```http
GET /users
```

---

# Two Factor Authentication

## Setup TOTP

### Request

```http
POST /users/2fa/totp/setup
```

### Response

```json
{
  "totp_secret": "BASE32SECRET",
  "qr_code": "data:image/png;base64,..."
}
```

---

## Verify TOTP

### Request

```http
POST /users/2fa/totp/verify
```

### Body

```json
{
  "code": "123456"
}
```

---

## Disable TOTP

### Request

```http
POST /users/2fa/totp/disable
```

---

# Media Reference Data

## Get Media Types

### Request

```http
GET /media/types
```

---

## Get Media Statuses

### Request

```http
GET /media/statuses
```

---

# Media Autocomplete

## Search Suggestions

### Request

```http
GET /media/autocomplete
```

### Query Parameters

| Parameter | Required |
| --------- | -------- |
| key       | Yes      |
| query     | Yes      |
| limit     | No       |

### Supported Keys

* title
* type
* status
* tag

### Example

```http
GET /media/autocomplete?key=title&query=break
```

---

# Media

## List Media

### Request

```http
GET /media
```

### Pagination

| Parameter | Description |
| --------- | ----------- |
| page      | Page number |

### Filters

| Parameter      | Description    |
| -------------- | -------------- |
| title          | Search title   |
| exclude_title  | Exclude title  |
| year           | Exact year     |
| year_gt        | Greater than   |
| year_lt        | Less than      |
| exclude_year   | Exclude year   |
| type           | Media type     |
| exclude_type   | Exclude type   |
| status         | Status         |
| exclude_status | Exclude status |
| sort           | Sort field     |
| order          | asc/desc       |

### Response

```json
{
  "media": [],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

---

## Create Media

### Request

```http
POST /media
```

### Content Type

```http
multipart/form-data
```

### Fields

| Field        | Required |
| ------------ | -------- |
| title        | Yes      |
| type_id      | Yes      |
| status_id    | Yes      |
| image        | Yes      |
| release_year | No       |
| description  | No       |

---

## Get Media

### Request

```http
GET /media/{id}
```

---

## Update Media

### Request

```http
PATCH /media/{id}
```

---

## Delete Media

### Request

```http
DELETE /media/{id}
```

---

# Characters

## Character Autocomplete

### Request

```http
GET /characters/autocomplete
```

### Supported Keys

* name

---

## List Characters

### Request

```http
GET /characters
```

### Filters

| Parameter      | Description    |
| -------------- | -------------- |
| name           | Character name |
| media          | Media title    |
| appearances    | Exact count    |
| appearances_gt | Greater than   |
| appearances_lt | Less than      |
| sort           | Sort field     |
| order          | asc/desc       |

---

## Create Character

### Request

```http
POST /characters
```

### Content Type

```http
multipart/form-data
```

### Fields

| Field    | Required |
| -------- | -------- |
| name     | Yes      |
| image    | No       |
| details  | No       |
| wiki_url | No       |

---

## Get Character

### Request

```http
GET /characters/{id}
```

---

## Update Character

### Request

```http
PATCH /characters/{id}
```

---

## Delete Character

### Request

```http
DELETE /characters/{id}
```

---

## Get Character Media

Returns all media a character appears in.

### Request

```http
GET /characters/{character_id}/media
```

---

# Character Roles

## List Roles

### Request

```http
GET /media-characters/roles
```

### Filters

| Parameter | Description    |
| --------- | -------------- |
| search    | Search by name |
| limit     | Result limit   |

---

## Create Role

### Request

```http
POST /media-characters/roles
```

### Body

```json
{
  "name": "Main Character"
}
```

---

## Get Role

### Request

```http
GET /media-characters/roles/{id}
```

---

## Delete Role

### Request

```http
DELETE /media-characters/roles/{id}
```

---

# Media Character Relationships

## Get Relationship

### Request

```http
GET /media-characters/{id}
```

---

## Delete Relationship

### Request

```http
DELETE /media-characters/{id}
```

---

## Get Characters For Media

### Request

```http
GET /media-characters/media/{media_id}/characters
```

---

## Add Character To Media

### Request

```http
POST /media-characters/media/{media_id}/characters
```

### Body

```json
{
  "character_id": 1,
  "role_id": 2
}
```

### Response

```json
{
  "message": "Character added to media successfully"
}
```

---

# User Media Statuses

## List Status Types

### Request

```http
GET /user-media/statuses
```

---

## Get Status Type

### Request

```http
GET /user-media/statuses/{id}
```

---

# User Media Autocomplete

### Request

```http
GET /user-media/autocomplete
```

### Supported Keys

* title
* type
* status
* user_status
* tag

---

# User Library

## List User Library Entries

### Request

```http
GET /user-media
```

### Media Filters

* title
* type
* status
* year

### User Filters

* user_status
* user_score

### Exclusion Filters

* exclude_title
* exclude_type
* exclude_status
* exclude_user_status
* exclude_year

### Sorting

* title
* release_year
* user_score
* progress_updated
* created_at

---

## Add Media To Library

### Request

```http
POST /user-media
```

### Body

```json
{
  "media_id": 1,
  "current_progress": 12,
  "status_id": 2,
  "score": 8,
  "review": "Great series"
}
```

---

## Get Library Entry

### Request

```http
GET /user-media/{id}
```

---

## Update Library Entry

### Request

```http
PATCH /user-media/{id}
```

---

## Delete Library Entry

### Request

```http
DELETE /user-media/{id}
```

---

# Pagination

All paginated endpoints return:

```json
{
  "items": [],
  "total": 120,
  "page": 1,
  "page_size": 20,
  "total_pages": 6
}
```

Endpoints using pagination:

* GET /media
* GET /characters
* GET /user-media

---

# Uploads

Image uploads use:

```http
multipart/form-data
```

Generated files:

* Original image
* Thumbnail image

Supported upload endpoints:

* POST /media
* POST /characters