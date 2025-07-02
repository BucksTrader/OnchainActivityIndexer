import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_, BooleanColumn as BooleanColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_, OneToMany as OneToMany_} from "@subsquid/typeorm-store"
import {PumpKekBuy} from "./pumpKekBuy.model"
import {PumpKekSell} from "./pumpKekSell.model"
import {PumpKekGraduation} from "./pumpKekGraduation.model"

@Entity_()
export class PumpKekProject {
    constructor(props?: Partial<PumpKekProject>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @StringColumn_({nullable: false})
    creator!: string

    @StringColumn_({nullable: false})
    name!: string

    @StringColumn_({nullable: false})
    symbol!: string

    @BigIntColumn_({nullable: false})
    totalDeposited!: bigint

    @BigIntColumn_({nullable: false})
    tokensSold!: bigint

    @BooleanColumn_({nullable: false})
    isGraduated!: boolean

    @DateTimeColumn_({nullable: false})
    creationTimestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number

    @OneToMany_(() => PumpKekBuy, e => e.project)
    buys!: PumpKekBuy[]

    @OneToMany_(() => PumpKekSell, e => e.project)
    sells!: PumpKekSell[]

    @OneToMany_(() => PumpKekGraduation, e => e.project)
    graduations!: PumpKekGraduation[]
}
