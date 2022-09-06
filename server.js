const express = require('express');
const app = express();
require('dotenv').config()
const { IgApiClient } = require('instagram-private-api');
const { writeFile, readFile, access ,constants} = require('fs/promises');
const path = require('path')
app.use(express.json())

async function instaSessionSave(data) {
    console.log("Trying to save the IG Session", data);
    try {
        await writeFile('login-data.json', JSON.stringify(data));
        console.log('Saved IG Session');
    } catch (err) {
        console.error(err);
    }
    return data;
}

const instaSessionExists = async () => {
    try {
        const accesses = await access( "login-data.json", constants.R_OK | constants.W_OK );
        console.log("accesses", accesses)
        return true
    } catch (err) {
        return false;
    }
}

async function instaSessionLoad() {
    console.log("Trying to load the IG Session");
    try {
        let datas = await readFile('login-data.json');
        console.log('Loaded the IG Session');
        return JSON.stringify(datas);
    } catch (err) {
        console.error(err);
        return false
    }
}

app.post('/api/login?name=password&password=Oti@marzki@9', function (req, res) {
    const user = req.body.name;
    const hashedPassword = (req.body.password);

     try{
        (async () => {
        const ig = new IgApiClient();
        ig.state.generateDevice(user);

        let shouldLogin = true;
            console.log("instaSessionExists", instaSessionExists())
        try {

            if (await instaSessionExists()) {
                shouldLogin = false;
                console.log('Insta Session Exists');
                let loaded_session = await instaSessionLoad()
                console.log('loaded_session: ' + loaded_session);
                await ig.state.deserialize(loaded_session);
                let userinfo = await ig.user.info(ig.state.cookieUserId);
                console.log('Insta Session Deserialized');
                // console.log("--userdata---1", userinfo)
                // console.log('------------', ig.user_follows())
                return res.send(userinfo)
            } else {
                console.log('Insta Session Does Not Exist');

            }
        } catch (e) {
            console.log('ERROOOR',e)
            return res.send(e)
        }

        if (shouldLogin) {
            console.log('----- !!! IG Account Login Procedure !!! ----- ')

            // await ig.simulate.preLoginFlow();

            ig.request.end$.subscribe(async () => {
                const serialized = await ig.state.serialize();
                delete serialized.constants; // this deletes the version info, so you'll always use the version provided by the library
                await instaSessionSave(serialized);
            });

            const loggedInUser = await ig.account.login(user, hashedPassword);
            console.log("--userdata---2", loggedInUser)
            return res.send(loggedInUser)
        }
    })();
    }catch(e) {
        console.log('first-------', e)
    }
})

const port = process.env.PORT || 3330
app.listen(port, () => console.log(`IG API server started listening on ${port}...`))
