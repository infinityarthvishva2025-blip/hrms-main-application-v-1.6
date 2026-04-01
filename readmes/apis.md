###############


LOGIN MODULE

1) login user
POST : /api/auth/login

body:
{
    "employeeCode":"IA00091",
    "password": "123456"
}

// 97 , 99 ----> employee

response:


{
    "statusCode": 200,
    "data": {
        "employee": {
            "_id": "69baeb3e046be6a5e5d739fa",
            "employeeCode": "IA00091",
            "name": "Super HR",
            "email": "hr@infinity.com",
            "role": "HR",
            "department": "HR",
            "profileImageUrl": "https://res.cloudinary.com/dkvydb06k/image/upload/v1774681550/hrms_profiles/jvk807fjfs8y2krjlvvs.jpg"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWJhZWIzZTA0NmJlNmE1ZTVkNzM5ZmEiLCJlbXBsb3llZUNvZGUiOiJJQTAwMDkxIiwicm9sZSI6IkhSIiwibmFtZSI6IlN1cGVyIEhSIiwiaWF0IjoxNzc0OTU2NDY0LCJleHAiOjE3NzQ5NTczNjR9.IPVKvmS7ZnYWb6FyaJTR2TOhHb3kfuN4EOiF9lAfFrM",
        "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWJhZWIzZTA0NmJlNmE1ZTVkNzM5ZmEiLCJpYXQiOjE3NzQ5NTY0NjQsImV4cCI6MTc3NTU2MTI2NH0.6KL72o9WqqWkvbwnTYtzq85Gdb3QaE9osOsqrnIeVsk"
    },
    "message": "Login successful",
    "success": true
}

2) refresh token

POST : /api/auth/refresh-token

body:
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWJhZWIzZTA0NmJlNmE1ZTVkNzM5ZmEiLCJpYXQiOjE3NzQ5NTY0NjQsImV4cCI6MTc3NTU2MTI2NH0.6KL72o9WqqWkvbwnTYtzq85Gdb3QaE9osOsqrnIeVsk"
}

response:

{
    "statusCode": 200,
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWJhZWIzZTA0NmJlNmE1ZTVkNzM5ZmEiLCJlbXBsb3llZUNvZGUiOiJJQTAwMDkxIiwicm9sZSI6IkhSIiwibmFtZSI6IlN1cGVyIEhSIiwiaWF0IjoxNzc0OTU2NTcyLCJleHAiOjE3NzQ5NTc0NzJ9.SnuKMeZfGDhs0D6WRoQLgyOP9kbk-bgyxYyTfYWqIwQ"
    },
    "message": "Token refreshed",
    "success": true
}

3) logout user

POST : /api/auth/logout

body:
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2OWJhZWIzZTA0NmJlNmE1ZTVkNzM5ZmEiLCJpYXQiOjE3NzQ5NTY0NjQsImV4cCI6MTc3NTU2MTI2NH0.6KL72o9WqqWkvbwnTYtzq85Gdb3QaE9osOsqrnIeVsk"
}

response:

{
    "statusCode": 200,
    "data": null,
    "message": "Logged out successfully",
    "success": true
}

4) me

GET : /api/auth/me

response:


{
    "statusCode": 200,
    "data": {
        "_id": "69baeb3e046be6a5e5d739fa",
        "employeeCode": "IA00091",
        "role": "HR",
        "status": "Active",
        "name": "Super HR",
        "email": "hr@infinity.com",
        "mobileNumber": "9999999999",
        "department": "HR",
        "bankVerified": false,
        "aadhaarVerified": false,
        "panVerified": false,
        "hasDisease": "No",
        "compOffBalance": 0,
        "createdAt": "2026-03-18T18:13:18.345Z",
        "updatedAt": "2026-03-31T11:38:00.162Z",
        "__v": 3,
        "experienceCertificateUrls": [],
        "faceDescriptor": [
            -0.24724991619586945,
            0.09853784739971161,
            -0.018350811675190926,
            0.014277186244726181
        ],
        "paidLeaveBalance": 0,
        "profileImageUrl": "https://res.cloudinary.com/dkvydb06k/image/upload/v1774681550/hrms_profiles/jvk807fjfs8y2krjlvvs.jpg"
    },
    "message": "Profile fetched",
    "success": true
}


5) chage-password

POST : /api/auth/change-password

body:
{
    "currentPassword": "123456",
    "newPassword": "123456"
}

response:

{
    "statusCode": 200,
    "data": null,
    "message": "Password changed successfully",
    "success": true
}

6) profile





#############################################################################################################################################





Holidays Module

####
// ── PROTECTED ALL ──
router.use(verifyJWT);

// ── EMPLOYEE VISIBILITY ──
router.get('/', getAllHolidays);

// ── MANAGEMENT ONLY ──
router.post('/', authorizeRoles('SuperUser', 'HR', 'GM', 'VP', 'Director'), createHoliday);
router.put('/:id', authorizeRoles('SuperUser', 'HR', 'GM', 'VP', 'Director'), updateHoliday);
router.delete('/:id', authorizeRoles('SuperUser', 'HR', 'GM', 'VP', 'Director'), deleteHoliday);
####




1) get all holidays

GET-   /api/holidays

response:

{
    "statusCode": 200,
    "data": [
        {
            "_id": "69cb70cd611e2582e0a58d29",
            "date": "2026-04-01T00:00:00.000Z",
            "name": "test",
            "type": "National",
            "description": "test-holiday",
            "createdBy": "69baeb3e046be6a5e5d739fa",
            "createdAt": "2026-03-31T06:59:25.474Z",
            "updatedAt": "2026-03-31T06:59:25.474Z",
            "__v": 0
        }
    ],
    "message": "Holidays fetched successfully",
    "success": true
}

2) create a holiday

POST- /api/holidays

body:

{
  "date": "2026-04-14",
  "name": "Dr. Ambedkar Jayanti",
  "type": "National",
  "description": "Birth anniversary of Dr. B.R. Ambedkar"
}

response:

{
    "statusCode": 201,
    "data": {
        "date": "2026-04-14T00:00:00.000Z",
        "name": "Dr. Ambedkar Jayanti",
        "type": "National",
        "description": "Birth anniversary of Dr. B.R. Ambedkar",
        "createdBy": "69baeb3e046be6a5e5d739fa",
        "_id": "69cb99db611e2582e0a5b029",
        "createdAt": "2026-03-31T09:54:35.684Z",
        "updatedAt": "2026-03-31T09:54:35.684Z",
        "__v": 0
    },
    "message": "Holiday created successfully",
    "success": true
}

3) update holiday

PUT - /api/holidays/:id

body:

{
  "date": "2026-05-14",
  "name": "Dr Bhimrao  Ambedkar Jayanti",
  "type": "National",
  "description": "Birth anniversary of Dr. B.R. Ambedkar"
}

response:

{
    "statusCode": 200,
    "data": {
        "_id": "69cb70cd611e2582e0a58d29",
        "date": "2026-05-14T00:00:00.000Z",
        "name": "Dr Bhimrao  Ambedkar Jayanti",
        "type": "National",
        "description": "Birth anniversary of Dr. B.R. Ambedkar",
        "createdBy": "69baeb3e046be6a5e5d739fa",
        "createdAt": "2026-03-31T06:59:25.474Z",
        "updatedAt": "2026-03-31T10:07:45.533Z",
        "__v": 0
    },
    "message": "Holiday updated successfully",
    "success": true
}


4) delete holiday

DELETE - /api/holidays/:id

response:

{
    "statusCode": 200,
    "data": null,
    "message": "Holiday deleted successfully",
    "success": true
}






ANNOUNCEMENT MODULE


###
// All routes require authentication
router.use(verifyJWT);

// ── ADMIN / HR ROUTES ──
const ADMIN_ROLES = ['SuperUser', 'HR', 'Director', 'VP', 'GM', 'Manager'];

router.post('/', authorizeRoles(...ADMIN_ROLES), createAnnouncement);
router.get('/', authorizeRoles(...ADMIN_ROLES), getAllAnnouncements);
router.patch('/:id', authorizeRoles(...ADMIN_ROLES), updateAnnouncement);
router.delete('/:id', authorizeRoles(...ADMIN_ROLES), deleteAnnouncement);




###


1) get all announcements

GET - /api/announcements

response:

{
    "statusCode": 200,
    "data": {
        "announcements": [
            {
                "_id": "69cb7109611e2582e0a59102",
                "title": "test annpouncement",
                "message": "hey , hi there whats going on ",
                "type": "General",
                "priority": "Normal",
                "targetType": "All",
                "targetDepartments": [],
                "targetRoles": [],
                "targetEmployees": [],
                "expiresAt": null,
                "isActive": true,
                "readBy": [
                    "69baeb3e046be6a5e5d739fa"
                ],
                "createdBy": {
                    "_id": "69baeb3e046be6a5e5d739fa",
                    "role": "HR",
                    "name": "Super HR",
                    "profileImageUrl": "https://res.cloudinary.com/dkvydb06k/image/upload/v1774681550/hrms_profiles/jvk807fjfs8y2krjlvvs.jpg"
                },
                "createdAt": "2026-03-31T07:00:25.334Z",
                "updatedAt": "2026-03-31T07:14:09.591Z",
                "__v": 1
            },
            {
                "_id": "69bd0d06b5c8a0420a476d87",
                "title": "test",
                "message": "hey , hi there",
                "type": "General",
                "priority": "Normal",
                "targetType": "All",
                "targetDepartments": [],
                "targetRoles": [],
                "targetEmployees": [],
                "expiresAt": null,
                "isActive": true,
                "readBy": [
                    "69bcd5905b92b6406f0e249d",
                    "69baeb3e046be6a5e5d739fa",
                    "69baf55852266e0b36c61523",
                    "69be64fd7b08407c5f4ade9e"
                ],
                "createdBy": {
                    "_id": "69baf55852266e0b36c61523",
                    "role": "Director",
                    "name": "director"
                },
                "createdAt": "2026-03-20T09:01:58.041Z",
                "updatedAt": "2026-03-30T05:00:02.266Z",
                "__v": 4
            }
        ],
        "total": 2,
        "page": 1,
        "limit": 50,
        "totalPages": 1
    },
    "message": "Announcements fetched successfully",
    "success": true
}


2) create announcement

POST - /api/announcements

body:

{
  "title": "System Maintenance",
  "message": "The system will be down for maintenance tonight from 10 PM to 12 AM.",
  "type": "General",
  "priority": "Important",
  "targetType": "All",
  "expiresAt": "2026-04-01T23:59:59.000Z",
  "isActive": true
}

response:

{
    "statusCode": 201,
    "data": {
        "_id": "69cb9f33611e2582e0a5b046",
        "title": "System Maintenance",
        "message": "The system will be down for maintenance tonight from 10 PM to 12 AM.",
        "type": "General",
        "priority": "Important",
        "targetType": "All",
        "targetDepartments": [],
        "targetRoles": [],
        "targetEmployees": [],
        "expiresAt": "2026-04-01T23:59:59.000Z",
        "isActive": true,
        "readBy": [],
        "createdBy": {
            "_id": "69baeb3e046be6a5e5d739fa",
            "role": "HR",
            "name": "Super HR"
        },
        "createdAt": "2026-03-31T10:17:23.705Z",
        "updatedAt": "2026-03-31T10:17:23.705Z",
        "__v": 0
    },
    "message": "Announcement created successfully",
    "success": true
}


3) update announcement

PATCH  - /api/announcements/:id

body:

{
  "title": "System Maintenance",
  "message": "The system will be down for maintenance tonight from 10 PM to 12 AM.",
  "type": "General",
  "priority": "Urgent",
  "targetType": "All",
  "expiresAt": "2026-04-01T23:59:59.000Z",
  "isActive": true
}
response:
{
    "statusCode": 200,
    "data": {
        "_id": "69cb9f33611e2582e0a5b046",
        "title": "System Maintenance",
        "message": "The system will be down for maintenance tonight from 10 PM to 12 AM.",
        "type": "General",
        "priority": "Urgent",
        "targetType": "All",
        "targetDepartments": [],
        "targetRoles": [],
        "targetEmployees": [],
        "expiresAt": "2026-04-01T23:59:59.000Z",
        "isActive": true,
        "readBy": [],
        "createdBy": {
            "_id": "69baeb3e046be6a5e5d739fa",
            "role": "HR",
            "name": "Super HR"
        },
        "createdAt": "2026-03-31T10:17:23.705Z",
        "updatedAt": "2026-03-31T10:21:49.779Z",
        "__v": 0
    },
    "message": "Announcement updated successfully",
    "success": true
}

4) delete announcement

DELETE - /api/announcements/:id

response:

{
    "statusCode": 200,
    "data": null,
    "message": "Announcement deleted successfully",
    "success": true
}



####
// ── EMPLOYEE ROUTES ──
router.get('/my', getMyAnnouncements);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markAsRead);

####


5) get my announcements

GET - /api/announcements/my

response:


{
    "statusCode": 200,
    "data": [
        {
            "_id": "69cb7109611e2582e0a59102",
            "title": "test annpouncement",
            "message": "hey , hi there whats going on ",
            "type": "General",
            "priority": "Normal",
            "targetType": "All",
            "targetDepartments": [],
            "targetRoles": [],
            "targetEmployees": [],
            "expiresAt": null,
            "isActive": true,
            "readBy": [
                "69baeb3e046be6a5e5d739fa"
            ],
            "createdBy": {
                "_id": "69baeb3e046be6a5e5d739fa",
                "role": "HR",
                "name": "Super HR",
                "profileImageUrl": "https://res.cloudinary.com/dkvydb06k/image/upload/v1774681550/hrms_profiles/jvk807fjfs8y2krjlvvs.jpg"
            },
            "createdAt": "2026-03-31T07:00:25.334Z",
            "updatedAt": "2026-03-31T07:14:09.591Z",
            "__v": 1
        },
        {
            "_id": "69bd0d06b5c8a0420a476d87",
            "title": "test",
            "message": "hey , hi there",
            "type": "General",
            "priority": "Normal",
            "targetType": "All",
            "targetDepartments": [],
            "targetRoles": [],
            "targetEmployees": [],
            "expiresAt": null,
            "isActive": true,
            "readBy": [
                "69bcd5905b92b6406f0e249d",
                "69baeb3e046be6a5e5d739fa",
                "69baf55852266e0b36c61523",
                "69be64fd7b08407c5f4ade9e"
            ],
            "createdBy": {
                "_id": "69baf55852266e0b36c61523",
                "role": "Director",
                "name": "director"
            },
            "createdAt": "2026-03-20T09:01:58.041Z",
            "updatedAt": "2026-03-30T05:00:02.266Z",
            "__v": 4
        }
    ],
    "message": "My announcements fetched successfully",
    "success": true
}

6) get unread count

GET - /api/announcements/unread-count

response:

{
    "statusCode": 200,
    "data": {
        "unreadCount": 1
    },
    "message": "Unread count fetched",
    "success": true
}

7) mark as read

PATCH - /api/announcements/:id/read

response:

{
    "statusCode": 200,
    "data": null,
    "message": "Marked as read",
    "success": true
}

###############################################################################################################################################

GURUKUL-MODULE


1) Get All Videos

GET - /api/v1/gurukul/videos

response:
{
    "statusCode": 200,
    "data": {
        "docs": [
            {
                "_id": "69cb709d611e2582e0a58cc2",
                "title": "test",
                "description": "test-video-2",
                "cloudinaryUrl": "https://res.cloudinary.com/dkvydb06k/video/upload/v1774940315/gurukul/videos/zbjc4eaokbjmb05zijcx.mp4",
                "publicId": "gurukul/videos/zbjc4eaokbjmb05zijcx",
                "duration": 55.701333,
                "createdBy": {
                    "_id": "69baeb3e046be6a5e5d739fa",
                    "name": "Super HR",
                    "email": "hr@infinity.com"
                },
                "isActive": true,
                "createdAt": "2026-03-31T06:58:37.062Z",
                "updatedAt": "2026-03-31T06:58:37.062Z"
            },
            {
                "_id": "69cb5d5f668018c496b7f27c",
                "title": "test-title",
                "description": "test-description",
                "cloudinaryUrl": "https://res.cloudinary.com/dkvydb06k/video/upload/v1774935390/gurukul/videos/paqzwzvdddsq5uw9nzid.mp4",
                "publicId": "gurukul/videos/paqzwzvdddsq5uw9nzid",
                "duration": 55.701333,
                "createdBy": {
                    "_id": "69baeb3e046be6a5e5d739fa",
                    "name": "Super HR",
                    "email": "hr@infinity.com"
                },
                "isActive": true,
                "createdAt": "2026-03-31T05:36:31.867Z",
                "updatedAt": "2026-03-31T05:36:31.867Z"
            }
        ],
        "totalDocs": 2,
        "limit": 10,
        "totalPages": 1,
        "page": 1,
        "pagingCounter": 1,
        "hasPrevPage": false,
        "hasNextPage": false,
        "prevPage": null,
        "nextPage": null
    },
    "message": "Videos fetched successfully",
    "success": true
}

2) Create Video

POST - /api/v1/gurukul/videos

body:form-data

{
  "title": "test-title",
  "description": "test-description",
  "video": "<video-file>"
}

response:

{
    "statusCode": 201,
    "data": {
        "title": "test",
        "description": "test",
        "cloudinaryUrl": "https://res.cloudinary.com/dkvydb06k/video/upload/v1774954858/gurukul/videos/rihne9oosvay4zpfjryp.mp4",
        "publicId": "gurukul/videos/rihne9oosvay4zpfjryp",
        "duration": 55.701333,
        "createdBy": "69baeb3e046be6a5e5d739fa",
        "isActive": true,
        "_id": "69cba96b611e2582e0a5b079",
        "createdAt": "2026-03-31T11:00:59.827Z",
        "updatedAt": "2026-03-31T11:00:59.827Z"
    },
    "message": "Video created successfully",
    "success": true
}

3) Update Video

PATCH - /api/v1/gurukul/videos/:id

body:

{
  "title": "test-title-updated",
  "description": "test-description-updated",
}

response:

{
    "statusCode": 200,
    "data": {
        "_id": "69cba96b611e2582e0a5b079",
        "title": "test-2",
        "description": "test",
        "cloudinaryUrl": "https://res.cloudinary.com/dkvydb06k/video/upload/v1774954858/gurukul/videos/rihne9oosvay4zpfjryp.mp4",
        "publicId": "gurukul/videos/rihne9oosvay4zpfjryp",
        "duration": 55.701333,
        "createdBy": "69baeb3e046be6a5e5d739fa",
        "isActive": true,
        "createdAt": "2026-03-31T11:00:59.827Z",
        "updatedAt": "2026-03-31T11:05:22.589Z"
    },
    "message": "Video updated successfully",
    "success": true
}

4) Delete Video

DELETE - /api/v1/gurukul/videos/:id

response:

{
    "statusCode": 200,
    "data": null,
    "message": "Video deleted successfully",
    "success": true
}

5) Get Video By ID

GET - /api/v1/gurukul/videos/:id

response:

{
    "statusCode": 200,
    "data": {
        "_id": "69cb709d611e2582e0a58cc2",
        "title": "test",
        "description": "test-video-2",
        "cloudinaryUrl": "https://res.cloudinary.com/dkvydb06k/video/upload/v1774940315/gurukul/videos/zbjc4eaokbjmb05zijcx.mp4",
        "publicId": "gurukul/videos/zbjc4eaokbjmb05zijcx",
        "duration": 55.701333,
        "createdBy": {
            "_id": "69baeb3e046be6a5e5d739fa",
            "name": "Super HR",
            "email": "hr@infinity.com"
        },
        "isActive": true,
        "createdAt": "2026-03-31T06:58:37.062Z",
        "updatedAt": "2026-03-31T06:58:37.062Z",
        "__v": 0,
        "sections": []
    },
    "message": "Video fetched successfully",
    "success": true
}
###
// ──────────────────────────────────────────────────────────────
// Section Routes (nested under video)
// ──────────────────────────────────────────────────────────────
router.get('/videos/:videoId/sections', getSectionsByVideo);      // All users
router.post('/videos/:videoId/sections', authorizeRoles(...MANAGEMENT_ROLES), createSection); // Admin
router.put('/sections/:id', authorizeRoles(...MANAGEMENT_ROLES), updateSection); // Admin
router.delete('/sections/:id', authorizeRoles(...MANAGEMENT_ROLES), deleteSection); // Admin

// ──────────────────────────────────────────────────────────────
// Subsection Routes (nested under section)
// ──────────────────────────────────────────────────────────────
router.get('/sections/:sectionId/subsections', getSubsectionsBySection); // All users
router.post('/sections/:sectionId/subsections', authorizeRoles(...MANAGEMENT_ROLES), createSubsection); // Admin
router.put('/subsections/:id', authorizeRoles(...MANAGEMENT_ROLES), updateSubsection); // Admin
router.delete('/subsections/:id', authorizeRoles(...MANAGEMENT_ROLES), deleteSubsection); // Admin

###

###############################################################################################################################################

ATTENDANCE MODULE


1) check-in

body:

{
    "latitude": "18.511516",
    "longitude": "73.680112"
}

response:

{
    "statusCode": 200,
    "data": {
        "attendance": {
            "employeeId": "69be64fd7b08407c5f4ade9e",
            "employeeCode": "IA00097",
            "employeeName": "madhav",
            "date": "2026-03-30T18:30:00.000Z",
            "inTime": "2026-03-31T11:13:38.527Z",
            "status": "P",
            "isLate": true,
            "lateMinutes": 434,
            "isGeoAttendance": true,
            "checkInLatitude": 18.511516,
            "checkInLongitude": 73.680112,
            "correctionRequested": false,
            "correctionStatus": "None",
            "isCompOffCredited": false,
            "reportParticipants": [],
            "reportReadBy": [],
            "_id": "69cbac62611e2582e0a5b09a",
            "correctionHistory": [],
            "createdAt": "2026-03-31T11:13:38.530Z",
            "updatedAt": "2026-03-31T11:13:38.530Z",
            "__v": 0,
            "inTimeFormatted": "04:43 pm",
            "outTimeFormatted": null,
            "id": "69cbac62611e2582e0a5b09a"
        },
        "checkedInAt": "2026-03-31T11:13:38.527Z"
    },
    "message": "Checked in successfully",
    "success": true
}

2) check-out

body:

{
    "latitude": "18.511516",
    "longitude": "73.680112"
}

response:

{
    "statusCode": 200,
    "data": {
        "attendance": {
            "employeeId": "69be64fd7b08407c5f4ade9e",
            "employeeCode": "IA00097",
            "employeeName": "madhav",
            "date": "2026-03-30T18:30:00.000Z",
            "inTime": "2026-03-31T11:13:38.527Z",
            "outTime": "2026-03-31T11:45:54.251Z",
            "status": "P",
            "isLate": true,
            "lateMinutes": 434,
            "isGeoAttendance": true,
            "checkInLatitude": 18.511516,
            "checkInLongitude": 73.680112,
            "checkOutLatitude": 18.511516,
            "checkOutLongitude": 73.680112,
            "correctionRequested": false,
            "correctionStatus": "None",
            "isCompOffCredited": false,
            "reportParticipants": [],
            "reportReadBy": [],
            "_id": "69cbac62611e2582e0a5b09a",
            "correctionHistory": [],
            "createdAt": "2026-03-31T11:13:38.530Z",
            "updatedAt": "2026-03-31T11:45:54.253Z",
            "__v": 0,
            "inTimeFormatted": "04:43 pm",
            "outTimeFormatted": "05:16 pm",
            "id": "69cbac62611e2582e0a5b09a"
        },
        "checkedOutAt": "2026-03-31T11:45:54.251Z"
    },
    "message": "Checked out successfully",
    "success": true
}

3) today

GET - /api/v1/attendance/today

response:
{
    "statusCode": 200,
    "data": {
        "record": {
            "_id": "69cbac62611e2582e0a5b09a",
            "employeeId": "69be64fd7b08407c5f4ade9e",
            "employeeCode": "IA00097",
            "employeeName": "madhav",
            "date": "2026-03-30T18:30:00.000Z",
            "inTime": "2026-03-31T11:13:38.527Z",
            "status": "P",
            "isLate": true,
            "lateMinutes": 434,
            "isGeoAttendance": true,
            "checkInLatitude": 18.511516,
            "checkInLongitude": 73.680112,
            "correctionRequested": false,
            "correctionStatus": "None",
            "isCompOffCredited": false,
            "reportParticipants": [],
            "reportReadBy": [],
            "correctionHistory": [],
            "createdAt": "2026-03-31T11:13:38.530Z",
            "updatedAt": "2026-03-31T11:13:38.530Z",
            "__v": 0,
            "inTimeFormatted": "04:43 pm",
            "outTimeFormatted": null,
            "id": "69cbac62611e2582e0a5b09a"
        },
        "date": "2026-03-30T18:30:00.000Z",
        "office": {
            "lat": 18.511516,
            "lng": 73.680112,
            "radius": 500000
        }
    },
    "message": "Today status fetched",
    "success": true
}

4) my-summary

GET - /api/attendance/my-summary


response:

-- to much data -- 


###
// Admin / Management only
router.get('/admin', authorizeRoles(...MANAGEMENT_ROLES, 'Manager'), getAdminAttendanceList);
router.patch('/mark-read/:id', authorizeRoles(...MANAGEMENT_ROLES, 'Manager'), markReportAsRead);

###

5) admin

GET - /api/attendance/admin

response:

{
    "statusCode": 200,
    "data": {
        "records": [
            {
                "_id": "69cbac62611e2582e0a5b09a",
                "employeeId": "69be64fd7b08407c5f4ade9e",
                "employeeCode": "IA00097",
                "employeeName": "madhav",
                "date": "2026-03-30T18:30:00.000Z",
                "inTime": "2026-03-31T11:13:38.527Z",
                "status": "P",
                "isLate": true,
                "lateMinutes": 434,
                "isGeoAttendance": true,
                "checkInLatitude": 18.511516,
                "checkInLongitude": 73.680112,
                "correctionRequested": false,
                "correctionStatus": "None",
                "isCompOffCredited": false,
                "reportParticipants": [],
                "reportReadBy": [],
                "correctionHistory": [],
                "createdAt": "2026-03-31T11:13:38.530Z",
                "updatedAt": "2026-03-31T11:13:38.530Z",
                "__v": 0,
                "inTimeFormatted": "04:43 pm",
                "outTimeFormatted": null,
                "id": "69cbac62611e2582e0a5b09a"
            }
        ],
        "total": 1,
        "page": 1,
        "limit": 50,
        "totalPages": 1
    },
    "message": "Attendance list fetched",
    "success": true
}

###

6) mark-read

PATCH - /api/attendance/mark-read/:id

response:

{
    "statusCode": 200,
    "data": {
        "attendance": {
            "employeeId": "69be64fd7b08407c5f4ade9e",
            "employeeCode": "IA00097",
            "employeeName": "madhav",
            "date": "2026-03-30T18:30:00.000Z",
            "inTime": "2026-03-31T11:13:38.527Z",
            "outTime": "2026-03-31T11:45:54.251Z",
            "status": "P",
            "isLate": true,
            "lateMinutes": 434,
            "isGeoAttendance": true,
            "checkInLatitude": 18.511516,
            "checkInLongitude": 73.680112,
            "checkOutLatitude": 18.511516,
            "checkOutLongitude": 73.680112,
            "correctionRequested": false,
            "correctionStatus": "None",
            "isCompOffCredited": false,
            "reportParticipants": [
                "69be64fd7b08407c5f4ade9e"
            ],
            "reportReadBy": [
                {
                    "employeeId": "69be64fd7b08407c5f4ade9e",
                    "readAt": "2026-03-31T11:50:43.484Z",
                    "_id": "69cc1163046be6a5e5d74364"
                }
            ],
            "correctionHistory": [],
            "_id": "69cbac62611e2582e0a5b09a",
            "createdAt": "2026-03-31T11:13:38.530Z",
            "updatedAt": "2026-03-31T11:50:43.485Z",
            "__v": 0,
            "inTimeFormatted": "04:43 pm",
            "outTimeFormatted": "05:16 pm",
            "id": "69cbac62611e2582e0a5b09a"
        }
    },
    "message": "Report marked as read",
    "success": true
}

###

7) `