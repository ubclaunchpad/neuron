import connection from '../config/database'

function getVolunteerProfile(req, res) {
    const { volunteerEmail } = req.body;

    if (!volunteerEmail) {
        return res.status(400).json({
            error: "Missing required field: 'volunteerEmail'"
        });
    }

    try {
        const query = `SELECT * FROM <volunteer-profiles-table-name> WHERE <key> = ?`;
        const values = [volunteerEmail];

        connection.query(query, values, (error, results) => {
            if (error) {
                return res.status(500).json({
                    error: error.message
                });
            }
            if (results.length == 0) {
                return res.status(500).json({
                    error: "No volunteer found under the given email"
                });
            }
            res.status(200).json(results[0]);
        });
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

function getVolunteers(req, res) {
    try {
        const query = `SELECT * FROM <volunteer-profiles-table-name>`;

        connection.query(query, [], (error, results) => {
            if (error) {
                return res.status(500).json({
                    error: error.message
                });
            }
            res.status(200).json(results);
        });
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error"
        });
    }
}

module.exports = { 
    getVolunteerProfile, 
    getVolunteers 
};
