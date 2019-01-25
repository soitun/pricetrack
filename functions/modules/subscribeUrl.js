const functions = require('firebase-functions')
const { db, hash, collection, cleanEmail } = require('../utils')
const FieldValue = require('firebase-admin').firestore.FieldValue

module.exports = functions.https.onRequest((req, res) => {
    // TODO: Add limit, paging
    let url = req.query.url
    let email = cleanEmail(req.query.email)

    let expect_price = req.query.expect_price ? parseInt(req.query.expect_price) : 0
    let expect_when = req.query.expect_when 
                        ? req.query.expect_when != 'down' ? 'any' : 'down'
                        : 'any'
    let active = req.query.active 
                    ? req.query.active != 'true' ? false : true
                    : true

    let default_method = 'email'
    let valid_methods = ['email']
    let methods = req.query.methods 
                    ? req.query.methods in valid_methods ? req.query.methods : default_method
                    : default_method

    if (!email || !url) {
        return res.status(400).json({ err: 1, msg: 'URL and email is required' })
    }

    const hashUrl = hash(url)
    const urlDoc = db.collection(collection.URLS).doc(hashUrl)
    urlDoc.get().then(docSnapshot => {
        if (docSnapshot.exists) {
            let subscribe = {
                email,
                active,
                expect_price,
                expect_when,
                methods,
                create_at: new Date()
            }
            urlDoc.onSnapshot(doc => {
                urlDoc.collection(collection.SUBSCRIBE).doc(email).set(subscribe, { merge: true }).then(docRef => {
                        console.log(`Added ${email}: ${JSON.stringify(docRef)}`)
                        res.json({ msg: 'ok', subscribe, hashUrl })
                    })
                    .catch(error => {
                        console.error("Error writing document: ", error)
                        res.status(400).json(error)
                    })
            })
        } else {
            return res.status(400).json({ err: 1, msg: 'URL is not exist' })
        }
    })
})

