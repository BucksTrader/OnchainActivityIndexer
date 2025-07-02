import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, BigIntColumn as BigIntColumn_, BooleanColumn as BooleanColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, StringColumn as StringColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {BasedBondingCurveBuy} from "./basedBondingCurveBuy.model"
import {BasedBondingCurveSell} from "./basedBondingCurveSell.model"
import {BasedBondingCurveGraduation} from "./basedBondingCurveGraduation.model"
import {BasedBondingCurveLiquidityAdded} from "./basedBondingCurveLiquidityAdded.model"

@Entity_()
export class BasedBondingCurveProject {
    constructor(props?: Partial<BasedBondingCurveProject>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @BigIntColumn_({nullable: false})
    totalBasedDeposited!: bigint

    @BigIntColumn_({nullable: false})
    tokensSold!: bigint

    @BooleanColumn_({nullable: false})
    isGraduated!: boolean

    @DateTimeColumn_({nullable: false})
    creationTimestamp!: Date

    @DateTimeColumn_({nullable: true})
    graduationTimestamp!: Date | undefined | null

    @IntColumn_({nullable: false})
    blockNumber!: number

    @StringColumn_({nullable: false})
    pairAddress!: string

    @StringColumn_({nullable: false})
    routerAddress!: string

    @OneToMany_(() => BasedBondingCurveBuy, e => e.project)
    buys!: BasedBondingCurveBuy[]

    @OneToMany_(() => BasedBondingCurveSell, e => e.project)
    sells!: BasedBondingCurveSell[]

    @OneToMany_(() => BasedBondingCurveGraduation, e => e.project)
    graduations!: BasedBondingCurveGraduation[]

    @OneToMany_(() => BasedBondingCurveLiquidityAdded, e => e.project)
    liquidityEvents!: BasedBondingCurveLiquidityAdded[]
}
