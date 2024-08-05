const { prisma } = require('../services/prisma')

const {
    sliceSquadWeldings,
    getWeldingToday,
} = require('../helpers/helperGetIntervalWelding')

const {
    someMinutesWorkorStopping,
    someForAllDevicesMinutesWorkorStopping,
    someForGasConsumption,
} = require('../helpers/helperCountServiceCycle')

const getCiclesWorkByPrometeus = async (req, res) => {
    const SECONDS_TO_WORK_IN_ONE_DAY = 8 * 3600 + 56 * 60
    const SECONDS_EFFECTIVE_CAPACITY = 7 * 3600 + 56 * 60

    const { first, last } = req.params
    try {
        const allDevices = await prisma.prometeus.findMany({
            select: {
                id: true,
                prometeusCode: true,
            },
        })

        const allCyclesByDayList = await Promise.all(
            allDevices.map(async (device) => {
                const weldingFragmentsTest = await prisma.$queryRaw`
                SELECT COUNT(*)::integer AS "qtdCordoesDeSolda",
                "data",
                SUM("fragmentosWelding")::integer AS "tempoTrabalhado"
                FROM (
                  SELECT
                    "capture",
                    TO_CHAR("createdAt", 'YYYY-MM-DD') AS "data",
                    COUNT(*)::integer AS "fragmentosWelding"
                  FROM "Welding"
                  WHERE "weldingId" = ${device.id}
                    AND
                      "createdAt"
                    BETWEEN
                      ${first}::date
                    AND
                      ${last}::date
                  GROUP BY "data", "capture"
                ) AS "aggregated_data"
                GROUP BY "data"
                ORDER BY "data"
              `
                console.table(weldingFragmentsTest)

                const totalCycle = {
                    qtdCordoesDeSolda: 0,
                    tempoTrabalhado: 0,
                    tempoParado: 0,
                    porcentagemTrabalhando: 0,
                    porcentagemParado: 0,
                    porcentagemCapacidadeEfetiva: 0,
                }

                const ciclesWorkByIdTeste = weldingFragmentsTest.map(
                    (item, index, arr) => {
                        item.tempoParado =
                            SECONDS_TO_WORK_IN_ONE_DAY - item.tempoTrabalhado
                        item.porcentagemTrabalhando = parseFloat(
                            (
                                (item.tempoTrabalhado * 100) /
                                SECONDS_TO_WORK_IN_ONE_DAY
                            ).toFixed(2)
                        )
                        item.porcentagemParado = parseFloat(
                            (
                                (item.tempoParado * 100) /
                                SECONDS_TO_WORK_IN_ONE_DAY
                            ).toFixed(2)
                        )
                        item.porcentagemCapacidadeEfetiva = parseFloat(
                            (
                                (item.tempoTrabalhado * 100) /
                                SECONDS_EFFECTIVE_CAPACITY
                            ).toFixed(2)
                        )
                        totalCycle.qtdCordoesDeSolda += item.qtdCordoesDeSolda
                        totalCycle.tempoTrabalhado += item.tempoTrabalhado
                        totalCycle.tempoParado += item.tempoParado

                        if (index == arr.length - 1) {
                            totalCycle.porcentagemTrabalhando +=
                                item.porcentagemTrabalhando
                            totalCycle.porcentagemParado +=
                                item.porcentagemParado
                            totalCycle.porcentagemCapacidadeEfetiva +=
                                item.porcentagemCapacidadeEfetiva
                        }

                        return item
                    }
                )

                return {
                    prometeus: device.prometeusCode,
                    weldingCycle: [ciclesWorkByIdTeste, [totalCycle]],
                }
            })
        )
        res.status(200).json(allCyclesByDayList)
    } catch (error) {
        res.status(404).json({
            error: 'erro interno no servidor',
        })
    }
}

const getAllCicleWorkOrStop = async (req, res) => {
    try {
        const { ids } = req.params

        const toDay = new Date().toISOString()

        const idPrometeus = ids.split(',')

        const result = []

        for (const id of idPrometeus) {
            const prometeus = await prisma.prometeus.findUnique({
                where: { id },
            })

            if (prometeus) {
                const specific = await prisma.welding.findMany({
                    where: {
                        weldingId: prometeus.id,
                    },
                    orderBy: {
                        capture: 'asc',
                        createdAt: 'asc',
                    },
                })

                console.log(specific)

                if (specific.length > 0) {
                    const weldingsToDay = getWeldingToday(specific, toDay)
                    const weldingsBySquads = sliceSquadWeldings(weldingsToDay)
                    const teste =
                        someForAllDevicesMinutesWorkorStopping(weldingsBySquads)
                    result.push({
                        prometeus: prometeus.prometeusCode,
                        cycles: teste,
                    })
                }
            }
        }
        res.status(200).json(result)
        // console.log(result)
    } catch (error) {
        console.log(error)
        res.status(404).json({
            error: 'erro interno no servidor',
        })
    }
}

const getGasConsumptionValues = async (req, res) => {
    try {
        const { ids, first, last } = req.params

        const data = new Date(last)
        data.setDate(data.getDate() + 1)

        const firstDate = new Date(first).toISOString()
        const lastDate = data.toISOString()

        const idPrometeus = ids.split(',')

        const results = []

        for (const id of idPrometeus) {
            const prometeus = await prisma.prometeus.findUnique({
                where: {
                    id,
                },
            })

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
                })

                if (weldings.length > 0) {
                    const weldingBySquads = sliceSquadWeldings(weldings)
                    const reverseWelding = weldingBySquads.reverse()
                    const gasValues = someForGasConsumption(reverseWelding)

                    results.push({
                        prometeus: prometeus.prometeusCode,
                        values: gasValues,
                    })
                }
            }
        }
        console.log(results)
        res.status(200).json(results)
    } catch (error) {
        console.log(error)
        res.status(404).json({
            error: 'erro interno no servidor',
        })
    }
}

const getCicleWorkOrStop = async (req, res) => {
    try {
        const { ids, first, last } = req.params
        const data = new Date(last)
        data.setDate(data.getDate() + 1)

        const firstDate = new Date(first).toISOString()
        const lastDate = data.toISOString()

        const idPrometeus = ids.split(',')

        const results = []

        for (const id of idPrometeus) {
            const prometeus = await prisma.prometeus.findUnique({
                where: {
                    id,
                },
            })

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
                })

                if (weldings.length > 0) {
                    const weldingBySquads = sliceSquadWeldings(weldings)
                    const reverseWelding = weldingBySquads.reverse()
                    const weldingCycle =
                        someMinutesWorkorStopping(reverseWelding)

                    results.push({
                        prometeus: prometeus.prometeusCode,
                        weldingCycle,
                    })
                }
            }
        }

        res.status(200).json(results)
    } catch (error) {
        console.log(error)
        res.status(404).json({
            error: 'erro interno no servidor',
        })
    }
}

module.exports = {
    getGasConsumptionValues,
    getCicleWorkOrStop,
    getAllCicleWorkOrStop,
}
