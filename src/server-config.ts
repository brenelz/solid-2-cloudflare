import { configureServerFunctionsServer } from '@solidjs/web/server-functions/server'
import { collectQueryFlightData } from './singleFlight.server.ts'

configureServerFunctionsServer({
    collectFlightData: collectQueryFlightData,
})
