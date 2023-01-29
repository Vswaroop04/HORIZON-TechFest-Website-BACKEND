const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const users = require("../models/userModel");
const teams = require("../models/teamModel");
const events = require("../models/eventModel");
const fetchuser = require("../middleware/FetchUser");
var upload = require('../Middleware/Multer');

const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const JWT_SECRET = 'iiitv-icd';


const { isValidObjectId, mailRegex, isValid, teamnameRegex } = require("../validators/validations");


// ROUTE 1:Create a User using: POST "/api/createuser". No login required
router.post('/signupuser', upload.single("proof"), async (req, res) => {
	var url= req.protocol + '://' + req.get('host') + req.originalUrl;
	// If there are errors, return Bad request and the errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	console.log(req.body.name);
	
	if (req.file) {

		var filepath = url+"/"+req.filename;
		console.log(filepath);

	}
	try {
		// Check whether the user with this email exists already
		let user = await users.findOne({ email: req.body.email });
		if (user) {
			return res.status(400).json({ error: "Sorry a user with this email already exists" })
		}
		const salt = await bcrypt.genSalt(10);
		const secPass = await bcrypt.hash(req.body.password, salt);

		// Create a new user
		user = await users.create({

			name: req.body.name,
			email: req.body.email,
			number: req.body.number,
			institute: req.body.institute,
			password: secPass,
			image: filepath,
			avatar:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAuNTggMTQ2LjE5Ij48ZyBzdHlsZT0iaXNvbGF0aW9uOmlzb2xhdGUiPjxnIGlkPSJMYXllcl8yIiBkYXRhLW5hbWU9IkxheWVyIDIiPjxnIGlkPSJPQkpFQ1RTIj48cGF0aCBkPSJNMTUwLjU4LDE0Ni4xOUgwYy4xMy0uODUuMy0xLjguNDktMi44MXMuNDMtMi4xNy42OS0zLjM0Yy4zOS0xLjc4Ljg0LTMuNjYsMS4zNC01LjU1LjMtMS4xMi42MS0yLjI0Ljk0LTMuMzQuNTctMS45NCwxLjItMy44MiwxLjg2LTUuNTUuNDUtMS4yLjkyLTIuMzIsMS40MS0zLjMzYTE3LjI3LDE3LjI3LDAsMCwxLDIuMTQtMy41NCwxMi4yMywxMi4yMywwLDAsMSwyLjMtMiw0Mi43Niw0Mi43NiwwLDAsMSw1Ljg4LTMuMzMsMTQyLjQsMTQyLjQsMCwwLDEsMTMuNzMtNS41NWM1LjE1LTEuODIsOS4xMy0zLDkuMTMtM2wxLjI3LS4zMiwxNy40OS00LjRIODUuMTJsMTguNTgsNC40LDMuNzguOXM0LjE0Ljk0LDkuNDksMi40NGExMjIuMywxMjIuMywwLDAsMSwxNi4xNyw1LjU1LDI2LjQ2LDI2LjQ2LDAsMCwxLDUuNzgsMy4zMyw3Ljk0LDcuOTQsMCwwLDEsMSwxLDI1LDI1LDAsMCwxLDIuNzgsNC41N2MuNTEsMSwxLDIuMTUsMS41MiwzLjMzLjc1LDEuNzUsMS40OCwzLjYzLDIuMTcsNS41NS40LDEuMTEuNzgsMi4yMywxLjE1LDMuMzQuNjIsMS45LDEuMTgsMy43OSwxLjY2LDUuNTUuMzEsMS4xNy41OSwyLjMuODMsMy4zNFMxNTAuNDUsMTQ1LjM1LDE1MC41OCwxNDYuMTlaIiBmaWxsPSIjNWQ0NmMyIi8+PHBhdGggZD0iTTExNywxMDcuODNIMzAuNzhjNS4xNS0xLjgyLDkuMTMtMyw5LjEzLTNsMS4yNy0uMzJIMTAzLjdsMy43OC45UzExMS42MiwxMDYuMzMsMTE3LDEwNy44M1oiIGZpbGw9IiM4MDU0ZjMiLz48cGF0aCBkPSJNMTM4LjkyLDExNi43MUgxMS4xN2E0Mi43Niw0Mi43NiwwLDAsMSw1Ljg4LTMuMzNIMTMzLjE0QTI2LjQ2LDI2LjQ2LDAsMCwxLDEzOC45MiwxMTYuNzFaIiBmaWxsPSIjODA1NGYzIi8+PHBhdGggZD0iTTE0NC4yMywxMjUuNkg1LjMyYy40NS0xLjIuOTItMi4zMiwxLjQxLTMuMzNoMTM2QzE0My4yMiwxMjMuMywxNDMuNzMsMTI0LjQyLDE0NC4yMywxMjUuNloiIGZpbGw9IiM4MDU0ZjMiLz48cGF0aCBkPSJNMTQ3LjU1LDEzNC40OUgyLjUyYy4zLTEuMTIuNjEtMi4yNC45NC0zLjM0SDE0Ni40QzE0Ni44LDEzMi4yNiwxNDcuMTgsMTMzLjM4LDE0Ny41NSwxMzQuNDlaIiBmaWxsPSIjODA1NGYzIi8+PHBhdGggZD0iTTE1MCwxNDMuMzhILjQ5Yy4yLTEsLjQzLTIuMTcuNjktMy4zNGgxNDhDMTQ5LjUyLDE0MS4yMSwxNDkuOCwxNDIuMzQsMTUwLDE0My4zOFoiIGZpbGw9IiM4MDU0ZjMiLz48ZyBvcGFjaXR5PSIwLjUiIHN0eWxlPSJtaXgtYmxlbmQtbW9kZTptdWx0aXBseSI+PHBhdGggZD0iTTgyLjg4LDE0MS42MWE1NS42Niw1NS42NiwwLDAsMS0yMi00LjYxQTU0LjU1LDU0LjU1LDAsMCwxLDQ2LDEyNy43NWEuNzcuNzcsMCwwLDEsMC0xLjA5Ljc2Ljc2LDAsMCwxLDEuMDgsMCw1NC4xMyw1NC4xMywwLDAsMCwxNC40NCw5LDUzLjI1LDUzLjI1LDAsMCwwLDM2Ljg3LDIuMTMuNzcuNzcsMCwwLDEsMSwuNTEuNzYuNzYsMCwwLDEtLjUxLDFBNTQuODQsNTQuODQsMCwwLDEsODIuODgsMTQxLjYxWiIgZmlsbD0iIzQ5MWE5MCIvPjwvZz48ZyBvcGFjaXR5PSIwLjUiIHN0eWxlPSJtaXgtYmxlbmQtbW9kZTptdWx0aXBseSI+PHBhdGggZD0iTTg1Ljc0LDEzNi44NGMtMTIuMzYsMC0yMi42Ni03LjY3LTIzLjEzLThhLjc2Ljc2LDAsMCwxLS4xNS0xLjA3Ljc3Ljc3LDAsMCwxLDEuMDgtLjE1Yy4xMi4wOSwxMi4xNCw5LDI1LjI2LDcuNTRhLjc3Ljc3LDAsMSwxLC4xNywxLjUzQTI5LjU1LDI5LjU1LDAsMCwxLDg1Ljc0LDEzNi44NFoiIGZpbGw9IiM0OTFhOTAiLz48L2c+PHBhdGggZD0iTTczLjMyLDEyOC40N2MtOC44NywwLTE1LjY3LTQuNTItMTkuNy0xMy4xMkEzOS40OCwzOS40OCwwLDAsMSw1MC4xOCwxMDJhMS4yOCwxLjI4LDAsMCwxLDEuMjEtMS4zNSwxLjMsMS4zLDAsMCwxLDEuMzUsMS4yMkEzNy42MiwzNy42MiwwLDAsMCw1NiwxMTQuMzNjMy43Myw3LjkxLDkuOCwxMS44LDE4LDExLjU3czE0LTQuMjYsMTcuMi0xMkEzMy44OSwzMy44OSwwLDAsMCw5My41NywxMDJhMS4yOCwxLjI4LDAsMSwxLDIuNTYsMCwzNS45NCwzNS45NCwwLDAsMS0yLjUzLDEyLjg4Yy0zLjUzLDguNjUtMTAuMjgsMTMuMzctMTkuNTIsMTMuNjNaIiBmaWxsPSIjZmZhYzMyIi8+PHBhdGggZD0iTTQwLjYzLDY5LjU1cy0yLjU2LDYuMDgsMCw5LjY3YTcuMTksNy4xOSwwLDAsMCw2LjYxLDNTNDQuODksOTEuNyw1Mi4wOSw5M3M4LjU4LTQuMzcsOC41OC00LjM3UzU0LjkxLDY1LjE4LDQwLjYzLDY5LjU1WiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik0xMDEuNjcsNjkuNTVzMi41Niw2LjA4LDAsOS42N2E3LjE5LDcuMTksMCwwLDEtNi42MSwzUzk3LjQxLDkxLjcsOTAuMjEsOTNzLTguNTgtNC4zNy04LjU4LTQuMzdTODcuMzksNjUuMTgsMTAxLjY3LDY5LjU1WiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik04Ny40OSwxMDQuMjRzLTMuODUsNy4yMS0xNC42MSw3LjIxYTE3LjI0LDE3LjI0LDAsMCwxLTE0Ljc4LTcuNTZsLjY0LTUuMTkuMS0uODcsMS04LjE2LDI1LjczLjcyLjQzLDMuMS4xNCwxWiIgZmlsbD0iI2ZmODg4MSIvPjxwYXRoIGQ9Ik04Niw5My40OWMtNS44Myw0Ljk0LTE1LjI2LDYuODItMjcuMjYsNS4yMWwuMS0uODcsMS04LjE2LDI1LjczLjcyWiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik01MC4xOCw2OC40NGMtNS43NSw4LTE4LjE0LDIuNi0xNy4zLTguMDYuNzctOS42NywxMS41Ny04LjE0LDExLjU3LTguMTRaIiBmaWxsPSIjZjU1YjVkIi8+PHBhdGggZD0iTTQ0Ljg4LDY4LjY0YS43Ni43NiwwLDAsMS0uNzQtLjU4Yy0xLjEyLTQuNTgtNS44OC04Ljg1LTUuOTItOC45YS43Ni43NiwwLDEsMSwxLTEuMTRjLjIxLjE4LDUuMTYsNC42Miw2LjM5LDkuNjdhLjc3Ljc3LDAsMCwxLS41Ni45M1oiIGZpbGw9IiNkMTM3M2YiLz48cGF0aCBkPSJNNDIuOSw2NC4yOWEuNjcuNjcsMCwwLDEtLjI0LDBBOC43OSw4Ljc5LDAsMCwwLDM4LjUzLDY0YS43Ny43NywwLDEsMS0uMzQtMS41LDEwLjEzLDEwLjEzLDAsMCwxLDUsLjMyLjc3Ljc3LDAsMCwxLS4yNSwxLjQ5WiIgZmlsbD0iI2QxMzczZiIvPjxwYXRoIGQ9Ik05Mi43OSw2OC40NGM1Ljc1LDgsMTguMTUsMi42LDE3LjMtOC4wNi0uNzctOS42Ny0xMS41Ny04LjE0LTExLjU3LTguMTRaIiBmaWxsPSIjZjU1YjVkIi8+PHBhdGggZD0iTTk4LjA5LDY4LjY0bC0uMTksMGEuNzcuNzcsMCwwLDEtLjU2LS45M2MxLjI0LTUsNi4xOC05LjQ5LDYuMzktOS42N2EuNzYuNzYsMCwxLDEsMSwxLjE0YzAsLjA1LTQuOCw0LjMyLTUuOTIsOC45QS43Ni43NiwwLDAsMSw5OC4wOSw2OC42NFoiIGZpbGw9IiNkMTM3M2YiLz48cGF0aCBkPSJNMTAwLjA3LDY0LjI5YS43Ny43NywwLDAsMS0uNzMtLjUyLjc2Ljc2LDAsMCwxLC40OC0xLDEwLjEyLDEwLjEyLDAsMCwxLDUtLjMyLjc3Ljc3LDAsMSwxLS4zNCwxLjVoMGE4Ljc5LDguNzksMCwwLDAtNC4xMy4yN0EuNjcuNjcsMCwwLDEsMTAwLjA3LDY0LjI5WiIgZmlsbD0iI2QxMzczZiIvPjxwYXRoIGQ9Ik00Mi4xNiw0MC41UzM5LjM1LDU3LjkzLDQ2LjYzLDc1YzYuNiwxNS40NSwxNi40MywyMC4yNiwyNS43NywyMC40MSwxMC42My4xNiwzMS44NC02LDI4LjMyLTU2LjQxQzk4LjM0LDQuODksNDUsNi4xLDQyLjE2LDQwLjVaIiBmaWxsPSIjZmY4ODgxIi8+PGcgb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNNjAuODYsNjguMzVjMCwxLjg5LTMuMzIsMy40Mi03LjQsMy40MnMtNy40LTEuNTMtNy40LTMuNDIsMy4zMS0zLjQxLDcuNC0zLjQxUzYwLjg2LDY2LjQ3LDYwLjg2LDY4LjM1WiIgZmlsbD0iI2Y1NWI1ZCIvPjwvZz48ZyBvcGFjaXR5PSIwLjUiPjxwYXRoIGQ9Ik05Ny43NSw2OC4zNWMwLDEuODktMy4zMSwzLjQyLTcuNCwzLjQyUzgzLDcwLjI0LDgzLDY4LjM1czMuMzEtMy40MSw3LjQtMy40MVM5Ny43NSw2Ni40Nyw5Ny43NSw2OC4zNVoiIGZpbGw9IiNmNTViNWQiLz48L2c+PHBhdGggZD0iTTczLjI3LDcwLjVoMGwtNC42OC0uMzdhLjY0LjY0LDAsMCwxLS41OC0uNjkuNjMuNjMsMCwwLDEsLjY5LS41OWwzLjkxLjMxTDcxLjM0LDU3LjI2YS42NC42NCwwLDEsMSwxLjI3LS4xM2wxLjMsMTIuNjZhLjYuNiwwLDAsMS0uMTguNTFBLjYxLjYxLDAsMCwxLDczLjI3LDcwLjVaIiBmaWxsPSIjZjU1YjVkIi8+PHBhdGggZD0iTTQ1LjQ2LDUwLjkxYy4zNSwzLjk0LTEuNzksOC44OC01LjE0LDYuNzktMS40OS0uOTMtMS4zNy0zLjc1LTItNy4xOC0uNy00LjA1LDEuMTctMy4yOC0zLTguNzNDMzEsMzYsMzMuOTIsMjcuNTIsMzguMzYsMjcuMjhjMCwwLTUuNTItOC44OSwyLjI3LTE1Ljc1LDctNi4xNywxMy4xNy0xLjgsMTMuMTctMS44UzU1LjExLDEuMzEsNjIuNDMuMTQsNzUuNTQsNS40MSw3NS41NCw1LjQxQTExLjg3LDExLjg3LDAsMCwxLDg5LDJjOC42OCwzLDYsOS4zLDYsOS4zczguNjYtMSwxMi4xNyw1LjQ1YTguNDcsOC40NywwLDAsMS0uOTQsOS43OXMzLjg0LDIuNTIsMyw5LjI4Yy0uNjgsNS43OS01LDYuMjQtNS4wOSwxMC4yMmEzNC43NCwzNC43NCwwLDAsMS0uOTIsNi42NmMtLjMyLDEuNDUtMS43Niw0LTMuMjUsNGgwYy0xLjkzLDAtMy4yNy0zLjE5LTMtNS4xLjQxLTMuMjIuNTQtNy44MS0xLjQ0LTEwLjQ2LTMuMjgtNC4zNi0xLjMtMTAtNi41OC0xMS41NHMtMjIuNzUsNi44Ni0zNS4yMy0uMTVjMCwwLC43NSw2LjktMy42Miw4Ljkycy01LjA2LDkuNC00LjcyLDEyLjUyWiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik02Mi4xOCw3NS4xM2E1Mi4yNCw1Mi4yNCwwLDAsMCwxOS40NS0uMjhzLS42OCw4LjM4LTEwLDguNDJDNjMuNzMsODMuMyw2Mi4xOCw3NS4xMyw2Mi4xOCw3NS4xM1oiIGZpbGw9IiNmNWVmZmYiLz48cGF0aCBkPSJNNjIuMTgsNTYuNzJjMCwyLjIyLTEsNC0yLjI2LDRzLTIuMjUtMS44LTIuMjUtNCwxLTQsMi4yNS00UzYyLjE4LDU0LjUxLDYyLjE4LDU2LjcyWiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik04Ni4xNCw1Ni43MmMwLDIuMjItMSw0LTIuMjYsNHMtMi4yNS0xLjgtMi4yNS00LDEtNCwyLjI1LTRTODYuMTQsNTQuNTEsODYuMTQsNTYuNzJaIiBmaWxsPSIjMTkyNzRiIi8+PHBhdGggZD0iTTU1LjkzLDQ3LjkyYTE5Ljk0LDE5Ljk0LDAsMCwxLDYuMTMtMi4yMiwxLjkyLDEuOTIsMCwwLDAsMS41Ni0yLjU0bC0uMDktLjIzYTEuOSwxLjksMCwwLDAtMi0xLjI2Yy0yLC4yMi01LjU2LjkyLTcuODcsMy4yMmExLjkyLDEuOTIsMCwwLDAtLjQ3LDEuOTJoMEExLjkxLDEuOTEsMCwwLDAsNTUuOTMsNDcuOTJaIiBmaWxsPSIjMTkyNzRiIi8+PHBhdGggZD0iTTg3Ljk0LDQ3LjkyYTE5Ljk0LDE5Ljk0LDAsMCwwLTYuMTMtMi4yMiwxLjkyLDEuOTIsMCwwLDEtMS41Ni0yLjU0bC4wOS0uMjNhMS45LDEuOSwwLDAsMSwyLTEuMjZjMiwuMjIsNS41Ni45Miw3Ljg3LDMuMjJhMS45LDEuOSwwLDAsMSwuNDcsMS45MmgwQTEuOTEsMS45MSwwLDAsMSw4Ny45NCw0Ny45MloiIGZpbGw9IiMxOTI3NGIiLz48cGF0aCBkPSJNNzIsODYuOEExMC43LDEwLjcsMCwwLDEsNjgsODZhLjY0LjY0LDAsMSwxLC41My0xLjE3czQsMS43NSw3LjE1LS4zNGEuNjQuNjQsMCwwLDEsLjcsMS4wOEE3Ljc3LDcuNzcsMCwwLDEsNzIsODYuOFoiIGZpbGw9IiNmNTViNWQiLz48cGF0aCBkPSJNNTguMDUsNjkuOUExMS4zMSwxMS4zMSwwLDEsMSw2OS4zNiw1OC41OSwxMS4zMiwxMS4zMiwwLDAsMSw1OC4wNSw2OS45Wm0wLTIxLjU5QTEwLjI4LDEwLjI4LDAsMSwwLDY4LjMzLDU4LjU5LDEwLjI5LDEwLjI5LDAsMCwwLDU4LjA1LDQ4LjMxWiIgZmlsbD0iI2Y1ZWZmZiIvPjxwYXRoIGQ9Ik04NS4yNyw2OS45QTExLjMxLDExLjMxLDAsMSwxLDk2LjU4LDU4LjU5LDExLjMzLDExLjMzLDAsMCwxLDg1LjI3LDY5LjlabTAtMjEuNTlBMTAuMjgsMTAuMjgsMCwxLDAsOTUuNTUsNTguNTksMTAuMjksMTAuMjksMCwwLDAsODUuMjcsNDguMzFaIiBmaWxsPSIjZjVlZmZmIi8+PHBhdGggZD0iTTk1LjQyLDU1LjQ0YS41Mi41MiwwLDAsMS0uMzgtLjg2LDkuOTEsOS45MSwwLDAsMSw4LjQ5LTIuOTMuNTIuNTIsMCwwLDEsLjQzLjU5LjUzLjUzLDAsMCwxLS41OS40Miw5LDksMCwwLDAtNy41NywyLjYxQS41Mi41MiwwLDAsMSw5NS40Miw1NS40NFoiIGZpbGw9IiNmNWVmZmYiLz48cGF0aCBkPSJNNDgsNTUuMjNhLjUyLjUyLDAsMCwxLS4zNy0uMTZoMFM0My41Miw1MSwzOC41Miw1Mi42NGEuNTIuNTIsMCwwLDEtLjY1LS4zMy41MS41MSwwLDAsMSwuMzMtLjY0YzUuNjItMS44OSwxMCwyLjUsMTAuMTQsMi42OWEuNTIuNTIsMCwwLDEtLjM2Ljg3WiIgZmlsbD0iI2Y1ZWZmZiIvPjxwYXRoIGQ9Ik02OC44NCw1Ny41NWgwYS41MS41MSwwLDAsMS0uNDgtLjU0Yy4wNi0uOS44My0yLjYsMy4zMy0yLjZTNzQuOTMsNTYuMTEsNzUsNTdhLjUyLjUyLDAsMCwxLTEsLjA2YzAtLjE2LS4xOS0xLjYzLTIuMy0xLjYzcy0yLjMsMS41Ny0yLjMsMS42M0EuNTIuNTIsMCwwLDEsNjguODQsNTcuNTVaIiBmaWxsPSIjZjVlZmZmIi8+PC9nPjwvZz48L2c+PC9zdmc+"
		});
		const data = {
			user: {
				id: user.id
			}
		}
		const authtoken = jwt.sign(data, JWT_SECRET);
		console.log(authtoken);
		let success = true;

		// res.json(user)
		let u={
			"data":{
				"user":{
					"name":user.name,
					"email":user.email,
				}
			}
		}
		res.json({ success, authtoken, user:u })
		console.log("Signed up");


	} catch (error) {
		console.error(error.message+"fghjkdfghj");
		res.status(500).send("Internal Server Error");
	}
})

router.post('/profile/avatar',fetchuser,async (req,res)=>{
	var userid=req.user.id;
	try{
		const user = await users.findOne({ _id: userid });
		user.set({ avatar: req.body.avatar });
		await user.save();
		return res.send({ status: true, message: "Avatar Changed Successfully" });
	}catch(error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
})

router.post('/loginuser', [
	body('email', 'Enter a valid email').isEmail(),
	body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
], async (req, res) => {
	// If there are errors, return Bad request and the errors
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}
	const { email, password } = req.body;

	try {
		let success = false;
		// Check whether the user with this email exists already
		let user = await users.findOne({ email });
		if (!user) {
			success = false
			return res.status(400).json({ error: "Please try to login with correct credentials" });
		}

		const passwordCompare = await bcrypt.compare(password, user.password);
		if (!passwordCompare) {
			success = false
			return res.status(400).json({ success, error: "Please try to login with correct credentials" });
		}
		console.log("loggedin")
		const data = {
			user: {
				id: user.id
			}
		}
		const authtoken = jwt.sign(data, JWT_SECRET);
		console.log(authtoken);
		success = true;
		let u={
			"data":{
				"user":{
					"name":user.name,
					"email":user.email,
				}
			}
		}
		res.json({ success, authtoken, user:u })

	} catch (error) {
		console.error(error.message);
		res.status(500).send("Internal Server Error");
	}
})




router.get("/userdashboard", fetchuser, async (req, res) => {
	console.log("hi");
	const userid = req.user.id;

	try {
		const user = await users.findOne({ _id: userid });

		var participation = user.participation;
		var indpart = [];
		var teampart = [];

		for (var i = 0; i < participation.length; i++) {
			var part = {};
			var participate = participation[i];
			const event = await events.findOne({ _id: participate.eventid });
			var status;

			var evedt = event.eventdate;
			var eveenddt = event.eventenddate;
			var nowdt = new Date();
			var ed = new Date(evedt);
			var eed = new Date(eveenddt);
			var nd = new Date(nowdt);
			if (ed.setHours(0, 0, 0, 0) > nd.setHours(0, 0, 0, 0)) {
				status = "Upcoming";
			}
			ed = new Date(evedt);
			nd = new Date(nowdt);
			if (ed.setHours(0, 0, 0, 0) == nd.setHours(0, 0, 0, 0)) {
				ed = new Date(evedt);
				nd = new Date(nowdt);
				if (ed > nd) {
					status = "Today";
				}
			}
			nd = new Date(nowdt);
			if (eed < nd) {
				status = "Completed";
			}
			status = !status ? "Ongoing" : status;

			delete evedt, eveenddt, nowdt, ed, eed, nd;

			part["eventname"] = event.eventname;
			part["eventstatus"] = status;
			part["description"] = event.eventdescription;

			if (participate.teamname != "") {
				const team = await teams.findOne({ _id: participate.teamid });
				part["teamname"] = team.teamname;
				part["leader"] = team.leader.name;
				part["members"] = [];
				for (let j = 0; j < team.emails.length; j++) {
					if (team.emails[j].name != user.name) part.members.push(team.emails[j].name);
				}
				teampart.push(part);
			}
			else indpart.push(part);
		}

		return res.send({status:true, name: user.name, indpart, teampart, avatar:user.avatar});
	}
	catch (error) {
		console.error(error.message);
		return res.send({status:false,message:"Internal Server Error"});
	}
})


router.post("/eventregister/:eventid", fetchuser, async (req, res) => {
	const userid = req.user.id;
	const eventid = req.params.eventid;

	if (!isValidObjectId(eventid)) {
		return res.send({ status: false, message: "Please provide a valid event id" });
	}

	try {
		const event = await events.findOne({ _id: eventid });
		const user = await users.findOne({ _id: userid });

		if(!user){
			return res.send({ status: false, message: "Error" });
		}
		if (!event) {
			return res.send({ status: false, message: "Please provide a valid event id" });
		}

		let us = await users.findOne({ _id: mongoose.Types.ObjectId(userid), "participation.eventid": mongoose.Types.ObjectId(eventid) });
		if (us) {
			return res.send({ status: false, message: "You are Already Registered in this event" });
		}

		var teamname = "";
		var teamid;
		var emails = [];
		var team;

		if (event.eventtype == "team") {
			let body = req.body;

			if (!isValid(body.teamname)) {
				return res.send({ status: false, message: "Team Name cannot be Empty" });
			}
			if (!teamnameRegex(body.teamname)) {
				return res.send({ status: false, message: "Not a valid Team Name" });
			}

			teamname = body.teamname;
			delete body["teamname"];
			delete body["leaderemail"];
			var usrarr = [];
			for (var key in body) {

				if (!isValid(body[key])) {
					return res.send({ status: false, message: "Email Field cannot be empty" });
				}
				if (!mailRegex(body[key])) {
					return res.send({ status: false, message: "Enter a valid Email" });
				}
				console.log("i");
				let usr = await users.findOne({ email: body[key] });
				
				if (!usr) return res.send({ status: false, message: `${key} is not Registered` });
				
				let us = await users.findOne({ _id: mongoose.Types.ObjectId(usr.id), "participation.eventid": mongoose.Types.ObjectId(eventid) });
				if (us) {
					return res.send({ status: false, message: `${usr.name} is Already Registered in this event` });
				}
				usrarr.push(usr);
			}
			console.log("m",user.email);
			team = await teams.create({
				eventid: eventid,
				teamname: teamname,
				emails: emails,
				leader: {
					email: user.email,
					name: user.name
				}
			});
			console.log("j");
			teamid = team._id;
			for (var i = 0; i < usrarr.length; i++) {
				let usr = usrarr[i];
				var participation = usr.participation;
				const participate = {
					_id: new mongoose.Types.ObjectId(),
					eventid: new mongoose.Types.ObjectId(eventid),
					eventname: event.eventname,
					teamid: teamid,
					teamname: teamname
				};
				participation = [...participation, participate];
				
				usr.set({ participation: participation });
				await usr.save();
				
				emails.push({ email: usr.email, name: usr.name });
				delete body["email" + (i + 1)];
			}
			team.set({ emails: emails });
			await team.save();
		}
		var participation = user.participation;
		const participate = {
			_id: new mongoose.Types.ObjectId(),
			eventid: new mongoose.Types.ObjectId(eventid),
			eventname: event.eventname,
			teamid: teamid,
			teamname: teamname
		};
		participation = [...participation, participate];
		
		user.set({ participation: participation });
		await user.save();
		
		event.set({ participants: event.participants + 1 });
		await event.save();
		
		return res.send({ status: true, message: "Registration Successfull" });
	}
	catch (error) {
		console.error(error.message);
		return res.send({status:false,message:"Check the details you have entered or it may be caused due to Internal Server Error"});
	}
})

module.exports = router;
