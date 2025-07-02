import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {PumpKekProject} from "./pumpKekProject.model"

@Entity_()
export class PumpKekSell {
    constructor(props?: Partial<PumpKekSell>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => PumpKekProject, {nullable: true})
    project!: PumpKekProject

    @StringColumn_({nullable: false})
    seller!: string

    @BigIntColumn_({nullable: false})
    tokenAmount!: bigint

    @BigIntColumn_({nullable: false})
    roomAmount!: bigint

    @BigIntColumn_({nullable: false})
    netAmount!: bigint

    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number
}
