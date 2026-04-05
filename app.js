const express = require('express');

const cors = require('./middleware/cors');
const securityHeaders = require('./middleware/securityHeaders');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const healthRouter = require('./routes/health');
const ownersRouter = require('./routes/owners');
const tenantsRouter = require('./routes/tenants');
const propertyUnitsRouter = require('./routes/propertyUnits');
const propertiesRouter = require('./routes/properties');
const agreementsRouter = require('./routes/agreements');
const paymentsRouter = require('./routes/payments');
const duesRouter = require('./routes/dues');
const dueCenterRouter = require('./routes/dueCenter');
const improvementsRouter = require('./routes/improvements');
const contractorsRouter = require('./routes/contractors');
const mediaRouter = require('./routes/media');

const app = express();

app.use(securityHeaders);
app.use(cors);
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

app.use('/health', healthRouter);
app.use('/api/owners', ownersRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/property-units', propertyUnitsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/agreements', agreementsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dues', duesRouter);
app.use('/api/due-center', dueCenterRouter);
app.use('/api/improvements', improvementsRouter);
app.use('/api/contractors', contractorsRouter);
app.use('/api/media', mediaRouter);

app.use(errorHandler);

module.exports = app;
