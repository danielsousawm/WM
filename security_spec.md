# Security Specification - WM Saúde Survey

## Data Invariants
- `municipality`: String, must be one of the allowed cities.
- `technicalQuality`, `resolutivity`, `deadlineCompliance`, `communication`, `overallSatisfaction`: Integer, between 1 and 10.
- `average`: Number, calculated as the mean of the 5 criteria.
- `date`: String (ISO) or Timestamp.

## Access Patterns
- **Public**: Can create new responses.
- **Admin**: Can read all responses and delete them if necessary.

## The Dirty Dozen (Test Cases)
1. Creating a response without a municipality.
2. Setting a score above 10.
3. Setting a score below 1.
4. Providing an average that doesn't match the scores.
5. Injecting unauthorized fields (e.g., `verified: true`).
6. Updating an existing response (immutability).
7. Deleting a response without being authenticated.
8. Reading the list of responses without being authenticated.
9. Injecting a very large string into `suggestions` or `clientName`.
10. Providing a non-string `municipality`.
11. Providing a non-number score.
12. Creating a response with a future date.
