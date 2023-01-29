const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const users = require("../models/userModel");
const teams = require("../models/teamModel");
const events = require("../models/eventModel");
const fetchuser = require("../middleware/FetchUser");
var upload = require('../middleware/Multer');

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
			gender: req.body.gender,
			institute: req.body.institute,
			password: secPass,
			image: filepath,
			avatar:"data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDkuMDIgMTUyLjI4Ij48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iT0JKRUNUUyI+PHBhdGggZD0iTTE0OSwxNTIuMjhIMHMyLTkuNDgsNC44NS0xOSw4Ljc1LTEzLjUxLDE2LjM3LTE1LjQ3LDM3LjctMTEuMzIsMzcuNy0xMS4zMmwxNS41LTEuMjRoLjE4bDE0LDEuMTJzMzEuNTksOS40OCwzOS4yMSwxMS40NCwxMy41Miw1Ljk0LDE2LjM3LDE1LjQ3UzE0OSwxNTIuMjgsMTQ5LDE1Mi4yOFoiIGZpbGw9IiNlOTM1NmUiLz48cGF0aCBkPSJNMTE3Ljg4LDE0NS4yN0g5OS43YS43Ni43NiwwLDAsMC0uNzcuNzd2Ni4yNGgxLjU0di01LjQ3aDE2LjY0djUuNDdoMS41NFYxNDZBLjc2Ljc2LDAsMCwwLDExNy44OCwxNDUuMjdaIiBmaWxsPSIjYzQyMDVjIi8+PGNpcmNsZSBjeD0iNzMuNjEiIGN5PSIxMjcuNCIgcj0iMS43NiIgZmlsbD0iI2Y1ZWZmZiIvPjxjaXJjbGUgY3g9IjczLjYxIiBjeT0iMTM2LjcyIiByPSIxLjc2IiBmaWxsPSIjZjVlZmZmIi8+PGNpcmNsZSBjeD0iNzMuNjEiIGN5PSIxNDYuMDQiIHI9IjEuNzYiIGZpbGw9IiNmNWVmZmYiLz48cG9seWdvbiBwb2ludHM9Ijc0LjYgMTA1LjI0IDc0LjYgMTA1LjI1IDc0LjUxIDEwNS4yNSA3NC42IDEwNS4yNCIgZmlsbD0iIzVkNDZjMiIvPjxwb2x5Z29uIHBvaW50cz0iNzQuNTEgMTA1LjI1IDc0LjQyIDEwNS4yNSA3NC40MiAxMDUuMjQgNzQuNTEgMTA1LjI1IiBmaWxsPSIjNWQ0NmMyIi8+PHBhdGggZD0iTTg4LjMzLDExMC4xN3MtMy44NSw3LjIyLTE0LjY0LDcuMjJhMTcuMjUsMTcuMjUsMCwwLDEtMTQuOC03LjU4bC42My01LjE5LjExLS44NywxLTguMTgsMjUuNzguNzIuNDMsMy4xMS4xNCwxWiIgZmlsbD0iI2ZmODg4MSIvPjxwYXRoIGQ9Ik01OS42MywxMDMuNzVzLTkuMTksMS41NC0xNiw3LjQ0YzAsMCwyLDExLjYxLDE1LjIzLDIzLjFsMTQuOC0xNi45UzYzLjc5LDExMy42Myw1OS42MywxMDMuNzVaIiBmaWxsPSIjYzQyMDVjIi8+PHBhdGggZD0iTTg3LjM4LDEwMy43NXM5LjE4LDEuNTQsMTYsNy40NGMwLDAtMiwxMS42MS0xNS4yMywyMy4xbC0xNC44LTE2LjlTODMuMjIsMTEzLjYzLDg3LjM4LDEwMy43NVoiIGZpbGw9IiNjNDIwNWMiLz48cGF0aCBkPSJNODYuODQsOTkuNGMtNS44NCw0Ljk1LTE1LjI5LDYuODMtMjcuMzIsNS4yMmwuMTEtLjg3LDEtOC4xOCwyNS43OC43MloiIGZpbGw9IiMxOTI3NGIiLz48cGF0aCBkPSJNNTEsNzQuMjljLTUuNzYsOC0xOC4xOCwyLjYxLTE3LjMzLTguMDcuNzYtOS42OSwxMS41OS04LjE2LDExLjU5LTguMTZaIiBmaWxsPSIjZjU1YjVkIi8+PHBhdGggZD0iTTQ1LjY1LDc0LjQ5YS43Ni43NiwwLDAsMS0uNzUtLjU4QzQzLjc3LDY5LjMyLDM5LDY1LDM5LDY1YS43Ny43NywwLDEsMSwxLTEuMTVjLjIxLjE5LDUuMTYsNC42NCw2LjQsOS42OWEuNzcuNzcsMCwwLDEtLjU2LjkzQS41NS41NSwwLDAsMSw0NS42NSw3NC40OVoiIGZpbGw9IiNkMTM3M2YiLz48cGF0aCBkPSJNNDMuNjYsNzAuMTRhLjY3LjY3LDAsMCwxLS4yNCwwLDguNTgsOC41OCwwLDAsMC00LjE1LS4yNy43Ni43NiwwLDAsMS0uOTEtLjU5Ljc4Ljc4LDAsMCwxLC41OC0uOTIsMTAuMTMsMTAuMTMsMCwwLDEsNSwuMzIuNzYuNzYsMCwwLDEsLjQ5LDFBLjc3Ljc3LDAsMCwxLDQzLjY2LDcwLjE0WiIgZmlsbD0iI2QxMzczZiIvPjxwYXRoIGQ9Ik05My42NCw3NC4yOWM1Ljc3LDgsMTguMTksMi42MSwxNy4zNC04LjA3LS43Ny05LjY5LTExLjU5LTguMTYtMTEuNTktOC4xNloiIGZpbGw9IiNmNTViNWQiLz48cGF0aCBkPSJNOTksNzQuNDlhLjU1LjU1LDAsMCwxLS4xOCwwLC43OC43OCwwLDAsMS0uNTctLjkzYzEuMjQtNS4wNSw2LjItOS41LDYuNDEtOS42OWEuNzguNzgsMCwwLDEsMS4wOS4wNi43Ny43NywwLDAsMS0uMDcsMS4wOXMtNC44MSw0LjMyLTUuOTMsOC45MUEuNzcuNzcsMCwwLDEsOTksNzQuNDlaIiBmaWxsPSIjZDEzNzNmIi8+PHBhdGggZD0iTTEwMC45NCw3MC4xNGEuNzcuNzcsMCwwLDEtLjczLS41My43Ni43NiwwLDAsMSwuNDgtMSwxMC4xNywxMC4xNywwLDAsMSw1LS4zMi43OC43OCwwLDAsMSwuNTguOTIuNzcuNzcsMCwwLDEtLjkyLjU5LDguNjksOC42OSwwLDAsMC00LjE0LjI3QS42Ny42NywwLDAsMSwxMDAuOTQsNzAuMTRaIiBmaWxsPSIjZDEzNzNmIi8+PHBhdGggZD0iTTQyLjkxLDQ2LjNTNDAuMSw2My43Niw0Ny4zOSw4MC44NGM2LjYyLDE1LjQ4LDE1LjQyLDIwLjMsMjQuNzgsMjAuNDUsMTAuNjUuMTcsMzMtNiwyOS40Mi01Ni41MkM5OS4yMSwxMC42Miw0NS43MywxMS44Myw0Mi45MSw0Ni4zWiIgZmlsbD0iI2ZmODg4MSIvPjxnIG9wYWNpdHk9IjAuNSI+PGVsbGlwc2UgY3g9IjU1LjQiIGN5PSI3NC4xOCIgcng9IjcuNCIgcnk9IjMuNDEiIGZpbGw9IiNmNTViNWQiLz48L2c+PGcgb3BhY2l0eT0iMC41Ij48ZWxsaXBzZSBjeD0iOTIuMyIgY3k9Ijc0LjE4IiByeD0iNy40IiByeT0iMy40MSIgZmlsbD0iI2Y1NWI1ZCIvPjwvZz48cGF0aCBkPSJNMTAyLjg1LDU4Ljg0YTExNi42MiwxMTYuNjIsMCwwLDEtMy4yNCwyOC40N2MtNiwyNS4zOC0yNi42MywyMi0yNi42MywyMnMtMjAuMjIsMy4zOS0yNi4yMy0yMkM0Myw3MS40OCw0MS4zOCw1OS42Nyw0MS4zOCw1OS42N2w0Ljc0LTYuMjdTNDguNDMsNzUuMjYsNTYuOCw3OS4wNWMwLDAsMy43Mi01LjY2LDE2LjE4LS4zNywxMi40Ni01LjI5LDE2LjU5LjM3LDE2LjU5LjM3LDguMzYtMy43OSw5LjA3LTI0LjgzLDkuMDctMjQuODNaIiBmaWxsPSIjMTkyNzRiIi8+PHBhdGggZD0iTTQ5LjIyLDM1LjcxczIsMTMuMTEtMy41NywxNy45VjY0LjQzbC0zLjI3LDFTMzkuNTMsNTEsMzguNDQsNDIuOUMzNi4zMywyNy4zMSw1MSwyNS4zMyw1MSwyNS4zM1oiIGZpbGw9IiMxOTI3NGIiLz48cGF0aCBkPSJNOTUuMDcsMzUuNzFzLTIsMTMuMTEsMy41NywxNy45VjY0LjQzbDMuMjcsMVMxMDQuNzYsNTEsMTA1Ljg1LDQyLjlDMTA4LDI3LjMxLDkzLjM0LDI1LjMzLDkzLjM0LDI1LjMzWiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik00MC40OSwzNC44N1MzMC43LDE3LjU4LDUzLjg5LDExLjI1QzcwLjA3LDYuODQsOTIsMTEuNDksOTksMGMwLDAsMiw3Ljg1LTEuOTEsMTIuODksMCwwLDEwLjU1LTMuMTYsMTMuNDgtOS4zNywwLDAsMy42Myw5LjczLTIsMTcuMjNhOS40Miw5LjQyLDAsMCwwLDguMi0xLjY0cy0uMzUsMjEuMjEtMTYuMDYsMjBhMzEuNDQsMzEuNDQsMCwwLDAtOS4wNi00LjI4Qzg1Ljg2LDMzLjEyLDgxLjIsNDIsNjYuMjUsMzguMjEsNTIuOTMsMzQuODcsNDcuNDQsMzIuNzYsNDAuNDksMzQuODdaIiBmaWxsPSIjMTkyNzRiIi8+PHBhdGggZD0iTTczLjQ5LDkyLjc5YTEwLjUzLDEwLjUzLDAsMCwxLTQtLjgyLjY1LjY1LDAsMCwxLS4zMi0uODVBLjY1LjY1LDAsMCwxLDcwLDkwLjhjLjA2LDAsNCwxLjc1LDcuMTctLjMzYS42NC42NCwwLDAsMSwuNzEsMS4wN0E3Ljg3LDcuODcsMCwwLDEsNzMuNDksOTIuNzlaIiBmaWxsPSIjMzM0NzZkIi8+PHBhdGggZD0iTTc1Ljc3LDc1Ljg4aC0uMDZMNzEsNzUuNWEuNjQuNjQsMCwwLDEtLjU5LS42OS42NS42NSwwLDAsMSwuNjktLjU5bDMuOTIuMzJMNzMuODMsNjIuNjJhLjY0LjY0LDAsMCwxLDEuMjctLjEzbDEuMywxMi42OWEuNjIuNjIsMCwwLDEtLjE4LjUxQS42NC42NCwwLDAsMSw3NS43Nyw3NS44OFoiIGZpbGw9IiNmNTViNWQiLz48cGF0aCBkPSJNNjMuNDMsODEuN2E1Mi4yNyw1Mi4yNywwLDAsMCwxOS41LS4yN3MtLjY4LDguMzktMTAsOC40M0M2NSw4OS44OSw2My40Myw4MS43LDYzLjQzLDgxLjdaIiBmaWxsPSIjZjVlZmZmIi8+PHBhdGggZD0iTTYzLDYyLjU2YzAsMi4yMi0xLDQtMi4yNiw0cy0yLjI1LTEuOC0yLjI1LTQsMS00LDIuMjUtNFM2Myw2MC4zMyw2Myw2Mi41NloiIGZpbGw9IiMxOTI3NGIiLz48cGF0aCBkPSJNODcsNjIuNTZjMCwyLjIyLTEsNC0yLjI2LDRzLTIuMjUtMS44LTIuMjUtNCwxLTQsMi4yNS00Uzg3LDYwLjMzLDg3LDYyLjU2WiIgZmlsbD0iIzE5Mjc0YiIvPjxwYXRoIGQ9Ik01Ni43MSw1My43NGEyMCwyMCwwLDAsMSw2LjE1LTIuMjNBMS45MiwxLjkyLDAsMCwwLDY0LjQxLDQ5bC0uMDgtLjIzYTEuOTIsMS45MiwwLDAsMC0yLTEuMjZjLTIsLjIyLTUuNTYuOTItNy44OCwzLjIzQTEuOSwxLjksMCwwLDAsNTQsNTIuNjJoMEExLjkxLDEuOTEsMCwwLDAsNTYuNzEsNTMuNzRaIiBmaWxsPSIjMTkyNzRiIi8+PHBhdGggZD0iTTg4Ljc5LDUzLjc0YTIwLDIwLDAsMCwwLTYuMTUtMi4yM0ExLjkyLDEuOTIsMCwwLDEsODEuMDksNDlsLjA4LS4yM2ExLjkyLDEuOTIsMCwwLDEsMi0xLjI2YzIsLjIyLDUuNTYuOTIsNy44OCwzLjIzYTEuOSwxLjksMCwwLDEsLjQ3LDEuOTJoMEExLjkxLDEuOTEsMCwwLDEsODguNzksNTMuNzRaIiBmaWxsPSIjMTkyNzRiIi8+PC9nPjwvZz48L3N2Zz4="
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
