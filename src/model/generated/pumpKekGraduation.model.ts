import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {PumpKekProject} from "./pumpKekProject.model"

@Entity_()
export class PumpKekGraduation {
    constructor(props?: Partial<PumpKekGraduation>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => PumpKekProject, {nullable: true})
    project!: PumpKekProject

    @BigIntColumn_({nullable: false})
    liquidity!: bigint

    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number
}
