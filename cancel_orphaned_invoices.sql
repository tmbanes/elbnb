UPDATE billing b
SET status = 'cancelled'
FROM accommodation_assignment a
JOIN accommodation_application app ON a.application_id = app.application_id
WHERE b.assignment_id = a.assignment_id
AND app.application_status IN ('cancelled', 'rejected')
AND b.status IN ('unpaid', 'pending', 'pending_verification', 'overdue');
