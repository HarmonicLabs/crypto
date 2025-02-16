import { EdwardsPoint, FieldElem51, LookupTableProjectiveNielsPoint, ProjectiveNielsPoint  } from "../rust_vrf_reimpl/curves"

describe("negate", () => {

    test("correct table derivation", () => {

        /*
        P = EdwardsPoint{
            X: FieldElem51([1422680009163921, 766380598192809, 1088194488561089, 107399654195339, 34818488801106]),
            Y: FieldElem51([1651398412242127, 381784425893612, 161665404640649, 1957498567022754, 2193450873567512]),
            Z: FieldElem51([2014131155464679, 287292762871404, 939330900425679, 620883563456150, 2080801888508539]),
            T: FieldElem51([1615491083854121, 1629675976460295, 1584162116208621, 1260997298124685, 460178507904829])
        }
        */
        const fromPt = new EdwardsPoint(
            new FieldElem51(new BigUint64Array([
                BigInt( "1422680009163921" ),
                BigInt( "766380598192809" ),
                BigInt( "1088194488561089" ),
                BigInt( "107399654195339" ),
                BigInt( "34818488801106" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1651398412242127" ),
                BigInt( "381784425893612" ),
                BigInt( "161665404640649" ),
                BigInt( "1957498567022754" ),
                BigInt( "2193450873567512" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "2014131155464679" ),
                BigInt( "287292762871404" ),
                BigInt( "939330900425679" ),
                BigInt( "620883563456150" ),
                BigInt( "2080801888508539" )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( "1615491083854121" ),
                BigInt( "1629675976460295" ),
                BigInt( "1584162116208621" ),
                BigInt( "1260997298124685" ),
                BigInt( "460178507904829" )
            ]))
        );

        const table = ProjectiveNielsPoint.tableFromEdwardPoint( fromPt );

        const expected = new LookupTableProjectiveNielsPoint([
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '3074078421406048' ),
                    BigInt( '1148165024086421' ),
                    BigInt( '1249859893201738' ),
                    BigInt( '2064898221218093' ),
                    BigInt( '2228269362368618' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '228718403078206' ),
                    BigInt( '1867203641386051' ),
                    BigInt( '1325270729764807' ),
                    BigInt( '1850098912827414' ),
                    BigInt( '2158632384766406' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '2014131155464679' ),
                    BigInt( '287292762871404' ),
                    BigInt( '939330900425679' ),
                    BigInt( '620883563456150' ),
                    BigInt( '2080801888508539' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1135092224731032' ),
                    BigInt( '1990296745200795' ),
                    BigInt( '355263432613495' ),
                    BigInt( '335779342455613' ),
                    BigInt( '54691380139760' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '374092264249542' ),
                    BigInt( '863868258467069' ),
                    BigInt( '1748109149844656' ),
                    BigInt( '2207051399495910' ),
                    BigInt( '2178135093473859' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '2080195621518364' ),
                    BigInt( '247827619491526' ),
                    BigInt( '1219741884504404' ),
                    BigInt( '843271948373092' ),
                    BigInt( '829054386496585' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1751431547506613' ),
                    BigInt( '114074786493659' ),
                    BigInt( '464571580823217' ),
                    BigInt( '1270428264042119' ),
                    BigInt( '444107805116723' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '2086813047630502' ),
                    BigInt( '108451751695458' ),
                    BigInt( '752043413118316' ),
                    BigInt( '2017016643279505' ),
                    BigInt( '1991099408099257' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '1342948883407943' ),
                    BigInt( '2699796801696692' ),
                    BigInt( '3380729507906561' ),
                    BigInt( '1413550562496122' ),
                    BigInt( '1107200482082250' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '690590507548724' ),
                    BigInt( '22580807095214' ),
                    BigInt( '1972728366731077' ),
                    BigInt( '996626599528777' ),
                    BigInt( '1512791434487400' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '175607488540025' ),
                    BigInt( '398707739354808' ),
                    BigInt( '496703210161458' ),
                    BigInt( '820608865986910' ),
                    BigInt( '1792433809823979' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '917726755385821' ),
                    BigInt( '481071676728463' ),
                    BigInt( '1836613522513161' ),
                    BigInt( '1887375732561484' ),
                    BigInt( '1691817283635517' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '2097260748067479' ),
                    BigInt( '462174379641566' ),
                    BigInt( '2284868281396933' ),
                    BigInt( '2620369688455062' ),
                    BigInt( '1839254986009393' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1332646427116288' ),
                    BigInt( '2171462175300110' ),
                    BigInt( '1429922914477812' ),
                    BigInt( '925709284716288' ),
                    BigInt( '832168289022299' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1326687090304351' ),
                    BigInt( '1030396293123410' ),
                    BigInt( '1737946789315054' ),
                    BigInt( '1670350114235165' ),
                    BigInt( '1714452146467150' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '673531694641542' ),
                    BigInt( '1564295146580012' ),
                    BigInt( '1288127004053011' ),
                    BigInt( '49419186396869' ),
                    BigInt( '2124123682113530' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '2457827603421789' ),
                    BigInt( '2048365626346141' ),
                    BigInt( '2766865251734879' ),
                    BigInt( '2735173236534479' ),
                    BigInt( '1883133037958648' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1978897673876358' ),
                    BigInt( '1734169635580657' ),
                    BigInt( '1491421270618595' ),
                    BigInt( '126176558531107' ),
                    BigInt( '1380095775670130' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1074608672685282' ),
                    BigInt( '1464237168835064' ),
                    BigInt( '699003433475604' ),
                    BigInt( '122591717779547' ),
                    BigInt( '1426982070835709' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '890234707961728' ),
                    BigInt( '1345147028352157' ),
                    BigInt( '238993211555149' ),
                    BigInt( '1082226501623096' ),
                    BigInt( '903260913513636' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '3345466859319402' ),
                    BigInt( '1684514451832447' ),
                    BigInt( '2652855670993693' ),
                    BigInt( '981871496449938' ),
                    BigInt( '2386069092249239' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '623694325533508' ),
                    BigInt( '798721523410453' ),
                    BigInt( '476456710496385' ),
                    BigInt( '2164294052450405' ),
                    BigInt( '534993680083126' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1200479871057118' ),
                    BigInt( '2231538933946923' ),
                    BigInt( '665578162105443' ),
                    BigInt( '1892559049338780' ),
                    BigInt( '1759905888666551' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1591973393518690' ),
                    BigInt( '465688226157875' ),
                    BigInt( '1541450369641843' ),
                    BigInt( '20547116396315' ),
                    BigInt( '1523046300732944' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '1409135512022111' ),
                    BigInt( '1383395441618404' ),
                    BigInt( '1746396918233653' ),
                    BigInt( '2141533545176288' ),
                    BigInt( '134038094917231' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1262952083799501' ),
                    BigInt( '2011447612203439' ),
                    BigInt( '1864714769288668' ),
                    BigInt( '1440687134436089' ),
                    BigInt( '78102232604887' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '762132680031750' ),
                    BigInt( '124836341587136' ),
                    BigInt( '1675751130021219' ),
                    BigInt( '1295210926911511' ),
                    BigInt( '2068278952158959' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1711994238763577' ),
                    BigInt( '927542391915990' ),
                    BigInt( '1647757079283084' ),
                    BigInt( '1936733173055765' ),
                    BigInt( '704790511023164' )
                ]))
            ),
            new ProjectiveNielsPoint(
                new FieldElem51(new BigUint64Array([
                    BigInt( '1763792416250575' ),
                    BigInt( '1985850071840192' ),
                    BigInt( '767669049317239' ),
                    BigInt( '1460090603738228' ),
                    BigInt( '1196170765685467' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1682742110247601' ),
                    BigInt( '1652741002739136' ),
                    BigInt( '2229139641803601' ),
                    BigInt( '1635100442473157' ),
                    BigInt( '171464105182906' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '395897620868236' ),
                    BigInt( '669587945539602' ),
                    BigInt( '1665786047991182' ),
                    BigInt( '1773515060342868' ),
                    BigInt( '1900644966303519' )
                ])),
                new FieldElem51(new BigUint64Array([
                    BigInt( '1905249830971794' ),
                    BigInt( '1281179288248572' ),
                    BigInt( '2055755246276643' ),
                    BigInt( '710589760329457' ),
                    BigInt( '1583988724798009' )
                ]))
            ),
        ]);

        expect( table ).toEqual( expected );

        expect( table.select(5) ).toEqual( expected.select(5) );
        // console.log( table.select(5) );

        //*
        const expectedPoint = new ProjectiveNielsPoint(
            new FieldElem51(new BigUint64Array([
                BigInt( '2457827603421789' ),
                BigInt( '2048365626346141' ),
                BigInt( '2766865251734879' ),
                BigInt( '2735173236534479' ),
                BigInt( '1883133037958648' )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( '1978897673876358' ),
                BigInt( '1734169635580657' ),
                BigInt( '1491421270618595' ),
                BigInt( '126176558531107' ),
                BigInt( '1380095775670130' )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( '1074608672685282' ),
                BigInt( '1464237168835064' ),
                BigInt( '699003433475604' ),
                BigInt( '122591717779547' ),
                BigInt( '1426982070835709' )
            ])),
            new FieldElem51(new BigUint64Array([
                BigInt( '890234707961728' ),
                BigInt( '1345147028352157' ),
                BigInt( '238993211555149' ),
                BigInt( '1082226501623096' ),
                BigInt( '903260913513636' )
            ]))
        );
        //*/

        expect( table.select(5) ).toEqual( expectedPoint );

        /*
        [50,226,194,190,122,95,182,4,1,18,71,32,29,30,73,12,26,94,131,209,209,208,178,101,108,66,248,117,249,7,40,3,]
        */
    })
})