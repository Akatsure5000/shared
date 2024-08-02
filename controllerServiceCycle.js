const { prisma } = require('../services/prisma');

const {
  sliceSquadWeldings,
  getWeldingToday,
} = require('../helpers/helperGetIntervalWelding');

const {
  someMinutesWorkorStopping,
  someForAllDevicesMinutesWorkorStopping,
  someForGasConsumption,
} = require('../helpers/helperCountServiceCycle');

const getAllCicleWorkOrStop = async (req, res) => {
  try {
    const { ids } = req.params;

    const toDay = new Date().toISOString();

    const idPrometeus = ids.split(',');

    const result = [];

    for (const id of idPrometeus) {
      const prometeus = await prisma.prometeus.findUnique({
        where: { id },
      });

      if (prometeus) {
        const specific = await prisma.welding.findMany({
          where: {
            weldingId: prometeus.id,
          },
          orderBy: {
            capture: 'asc',
            createdAt: 'asc',
          },
        });

        console.log(specific)

        if (specific.length > 0) {
          const weldingsToDay = getWeldingToday(specific, toDay);
          const weldingsBySquads = sliceSquadWeldings(weldingsToDay);
          const teste =
            someForAllDevicesMinutesWorkorStopping(weldingsBySquads);
          result.push({
            prometeus: prometeus.prometeusCode,
            cycles: teste,
          });
        }
      }
    }
    res.status(200).json(result);
    // console.log(result)
  } catch (error) {
    console.log(error);
    res.status(404).json({
      error: 'erro interno no servidor',
    });
  }
};

const getGasConsumptionValues = async (req, res) => {
  try {
    const { ids, first, last } = req.params;

    const data = new Date(last);
    data.setDate(data.getDate() + 1);

    const firstDate = new Date(first).toISOString();
    const lastDate = data.toISOString();

    const idPrometeus = ids.split(',');

    const results = [];

    for (const id of idPrometeus) {
      const prometeus = await prisma.prometeus.findUnique({
        where: {
          id,
        },
      });

      if (prometeus) {
        const weldings = await prisma.welding.findMany({
          where: {
            weldingId: prometeus.id,

            createdAt: {
              gte: firstDate,
              lte: lastDate,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (weldings.length > 0) {
          const weldingBySquads = sliceSquadWeldings(weldings);
          const reverseWelding = weldingBySquads.reverse();
          const gasValues = someForGasConsumption(reverseWelding);

          results.push({
            prometeus: prometeus.prometeusCode,
            values: gasValues,
          });
        }
      }
    }
    console.log(results);
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(404).json({
      error: 'erro interno no servidor',
    });
  }
};

const getCicleWorkOrStop = async (req, res) => {
  try {
    const { ids, first, last } = req.params;
    const data = new Date(last);
    data.setDate(data.getDate() + 1);

    const firstDate = new Date(first).toISOString();
    const lastDate = data.toISOString();

    const idPrometeus = ids.split(',');

    const results = [];

    for (const id of idPrometeus) {
      const prometeus = await prisma.prometeus.findUnique({
        where: {
          id,
        },
      });

      if (prometeus) {
        const weldings = await prisma.welding.findMany({
          where: {
            weldingId: prometeus.id,
            createdAt: {
              gte: firstDate,
              lte: lastDate,
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (weldings.length > 0) {
          const weldingBySquads = sliceSquadWeldings(weldings);
          const reverseWelding = weldingBySquads.reverse();
          const weldingCycle = someMinutesWorkorStopping(reverseWelding);

          results.push({
            prometeus: prometeus.prometeusCode,
            weldingCycle,
          });
        }
      }
    }

    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(404).json({
      error: 'erro interno no servidor',
    });
  }
};

module.exports = {
  getGasConsumptionValues,
  getCicleWorkOrStop,
  getAllCicleWorkOrStop,
};
