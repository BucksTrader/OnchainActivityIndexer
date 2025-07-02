import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToOne as OneToOne_, Index as Index_, JoinColumn as JoinColumn_, BigIntColumn as BigIntColumn_, DateTimeColumn as DateTimeColumn_} from "@subsquid/typeorm-store"
import {BasedBondingCurveProject} from "./basedBondingCurveProject.model"

@Entity_()
export class BasedBondingCurveLP {
    constructor(props?: Partial<BasedBondingCurveLP>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_({unique: true})
    @OneToOne_(() => BasedBondingCurveProject, {nullable: true})
    @JoinColumn_()
    project!: BasedBondingCurveProject

    @BigIntColumn_({nullable: false})
    basedReserve!: bigint

    @BigIntColumn_({nullable: false})
    tokenReserve!: bigint

    @BigIntColumn_({nullable: false})
    lpTokens!: bigint

    @DateTimeColumn_({nullable: false})
    creationTimestamp!: Date
}
