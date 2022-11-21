const request = require('supertest');
const app = require('../../app')
const {mongoConnect, mongoDisconnect} = require('../../services/mongo');

describe('Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
    });

    afterAll(async () => {
        await mongoDisconnect();
    })

    describe('Test GET /launches', () => {
        test('It should respond with 200 success', async () => {
            const response = await request(app).get('/v1/launches');
            expect(response.statusCode).toBe(200);

        })
    })

    describe('Test POST /launches', () => {
        const completeLaunchData = {
            mission: 'Kepler Exploration X',
            rocket: 'Explorer IS1',
            launchDate: 'December 27, 2030',
            target: 'Kepler-442 b',
        }
        const launchDataWithoutDate = {
            mission: 'Kepler Exploration X',
            rocket: 'Explorer IS1',
            target: 'Kepler-442 b',
        }
        const launchDataWithInvalidtDate = {
            mission: 'Kepler Exploration X',
            rocket: 'Explorer IS1',
            target: 'Kepler-442 b',
            launchDate: 'sdf'
        }
        test('It should respond with 201 success', async () => {
            const response = await request(app).post('/v1/launches')
                .send(completeLaunchData)
                .expect('Content-Type', /json/)
                .expect(201);
            const requestDate = new Date(completeLaunchData.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();
            expect(responseDate).toBe(requestDate);
            expect(response.body).toMatchObject(launchDataWithoutDate);

        })

        test('It should catch missing required properties', async () => {
            const response = await request(app).post('/v1/launches')
                .send(launchDataWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400);
            expect(response.body).toStrictEqual({error: 'missing values'});
        })

        test('It should catch invalid dates', async () => {
            const response = await request(app).post('/v1/launches')
                .send(launchDataWithInvalidtDate)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toStrictEqual({error: 'Invalid launch date'});
        })
    })
})