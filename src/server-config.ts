import { configureServerFunctionsServer } from '@solidjs/web/server-functions/server'
import { provideRequestEvent } from '@solidjs/web/storage'
import { collectRouterFlightData } from './singleFlight.ts'

configureServerFunctionsServer({
    // Loader calls run after the mutation's original event scope has closed.
    collectFlightData: (event, outcome) =>
        provideRequestEvent(event, () => collectRouterFlightData(event, outcome)),
})
