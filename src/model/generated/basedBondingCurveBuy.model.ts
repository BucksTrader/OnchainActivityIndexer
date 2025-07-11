import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, StringColumn as StringColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {BasedBondingCurveProject} from "./basedBondingCurveProject.model"

@Entity_()
export class BasedBondingCurveBuy {
    constructor(props?: Partial<BasedBondingCurveBuy>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => BasedBondingCurveProject, {nullable: true})
    project!: BasedBondingCurveProject

    @StringColumn_({nullable: false})
    buyer!: string

    @BigIntColumn_({nullable: false})
    basedAmount!: bigint

    @BigIntColumn_({nullable: false})
    tokenAmount!: bigint

    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number
}
