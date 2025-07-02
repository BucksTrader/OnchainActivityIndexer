import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_, IntColumn as IntColumn_} from "@subsquid/typeorm-store"
import {BasedBondingCurveProject} from "./basedBondingCurveProject.model"

@Entity_()
export class BasedBondingCurveGraduation {
    constructor(props?: Partial<BasedBondingCurveGraduation>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => BasedBondingCurveProject, {nullable: true})
    project!: BasedBondingCurveProject

    @BigIntColumn_({nullable: false})
    liquidity!: bigint

    @DateTimeColumn_({nullable: false})
    timestamp!: Date

    @IntColumn_({nullable: false})
    blockNumber!: number
}
