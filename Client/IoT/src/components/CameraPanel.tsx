import React, { useState } from 'react';
import CameraHistoryModal from './CameraHistoryModal';

// interface Props {
//   streamUrl: string;
// }

// const CameraPanel: React.FC<Props> = ({ streamUrl }) => {
//   console.log(streamUrl);
//   return (
//     <div>
//       <h3>Camera trong nhà (Live)</h3>
//       <img
//         src={"http://192.168.43.168:5000/stream"}
//         alt="Camera live"
//         style={{ width: '100%', maxWidth: '640px', border: '1px solid #ccc', borderRadius: 4 }}
//       />
//     </div>
//   );
// };

const CameraPanel: React.FC<{ streamUrl: string }> = ({ streamUrl }) => {
  console.log(streamUrl);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24 }}>📹</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Camera giám sát</h3>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            📸 Lịch sử
          </button>
        </div>
        
        <div style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
        }}>
          <img
            src={"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIALcAwQMBIgACEQEDEQH/xAAcAAACAwEBAQEAAAAAAAAAAAADBAACBQEGBwj/xAA+EAACAQIEAggEBQQBAwQDAAABAgMAEQQSITETQQUiUWFxgZHwFDKhsUJSYsHRBiPh8RVTorJzgpLiBzNU/8QAGQEAAwEBAQAAAAAAAAAAAAAAAAECAwQF/8QAJREAAgIABQQDAQEAAAAAAAAAAAECEQMSEyExFEFRUgQVYTIF/9oADAMBAAIRAxEAPwD43lqWogWuhK0oAeWplo1q7kooAIWrZKOsdXCVaQhYxaf/AFq4j6oplY67w6rKTYtkroWnfh7MD2irrh6rIKxLJ+irBNPl8/fvSnhCyi3v3/Nd4Ftl0HZvfUU1AViaR6fi8tq4U8++n1ibby/euDD/AC+dGUdiBRjUCX6vZT7Q+9K5wqMoWJ8HT5agjtTRiqcOllHYoRrXGSmuHXDHRQChSuGLLr2+/wBqZMdVyVNDQvlqZKPkrmSkALLUomWpQArlq4FWtV0WoKKAWoipmN6sEtrRBtQhFQlG4Jyi2/Lq1YDXTspqIgqCGuTuK1jQmD+HFhfs+lVWLqHxrQEaM4JOnbl2qyIY8w0K3JufHsvWpArDh7m1r35edMwYRmPy/MNztVsNGGkQsGIJ1UDQ/wAc63cGjGQIIx1hYEnl29+9XChOzJTo8cT5OWvdRR0azsMi9e+u+1bE8c3GjjyKqhSxYMCANOQ96UWGUKylnDWNrZdSPTvrTYnc89LgTF8/Z4UvJEo/BXqulcRFFZHZUVhvlsV3rz05CwFlUFSdC2nVrOTXYaRnMt+/u7KskXs12S6ZVVV6yjX350fDlG6rb1naZYpJAw1y7ULLcjNvWwkTh/0VPgUd8/23qqvgRliLSqmHWtv4OyksvV5UCXBZWzHqgjRe2nlAxWi65rhi8u6tRsNbWgyw1DQ0ZrRfpquSnTHQnjqCkK5KlMZalIBER0aNNKKEoidUgGoKKJF+mixwqApkXXXLZtb0bC2zLn+X7UxMgFswuo+UDc+lNIBTJ+VNedBkje+hy1pCPiuAUyBRlvYm1+3vpxeipL2jXiAD5QfHW1PKyWxTAx8SReNpGx1J2Pv96Y6Vw/CLRRqyhjmDvcXtyHn9u+n8BxOi8QA0b8Nurm7DS/SrSsf7kuZbkoCutib1qlUSeWZ0UjwnqjM16cjxWIykCZwbWA7KrhcODGGF7ltL7U3NhF4R4DDNbXxoQNAXxcxBGZiwt16vNjpEw7RhvnsH8R7+lAR2AuqWvoR39tWjiGbrcuttejMwo5NK02R3YO12AJ77m1dmwrKgW66G9xyo+Gwy5lYMrHYKDb961sMUisCuXXS2/vSnVhwecfCskSKozJqTbn31XDqkZJk2Gxr1s8CTBguXmEsvaTtSDf07nhciTrrfTtpODQGSk6vCpP4LhvpRfjiY+Ep0AsDpp70oXwbqrGRWKL1cwXQH9qEYmT50t2HtFK2iqHcJPx7xyHQbtbagPKczh3ZgDZdb0tlK9Za6cza0rYUE47nQLYDnQ5esb799ctpVeG1AUUYaUFlpvJpXOHSGJcOpTfDqUUAgEq0UbFraa/mpgRdY0VIHGq86zLoWKMDbXWn+j8OzHMTYDS59KukMCMOIdxt2G1OxtHw40Sw8V2rSNEOxqPo+NEHC67bkHW9DdBAsphMiud1G1WixPDDfLqKVnnuzt2+Na7Ik682SALKwbW+UfvSrSrmGVbg6W7KG8mbX2aEXaoch0aAeJQAM1+dDM1nKjY6UmJG/NXS1LMOhhyrHMNz+1dBt1lzZjqaT5irozZfOlYUPodOsde2mFkswOa+m1ZqyUZH0q1IVGrFiGuLHS+p7ascVLbMWfhA20PPx9azUmcdXt0phcRI2G4Ja6M2e3fVWFD0uWSC0HV4h/uW3OtL4bDsrqsxsV+U0ESZPzDuo0cpxEuZ/lQc++k9x0Dl6PaZ5JbKEuM5Hnt9qVCxLOyojMpIvftp6RwsbCLPb9XvsrU6J6MGIcF7quYMtm6x1qR0eZlwuRyQVt8xXxpd9TZdhXrv6ygwy4kyYZWR8oWRRyI7OW1ecih44tkt3nnQAnbu8qvGmYXy0SOJzZQL62tWrgsOyDI65VPV1XnVJEsycldrf+CgqU8ojz64bMRy1tTvDyR5dupuOdaCYPTraHsrhw1jXEpo9CWEYown4++i5claMkP8Ab+XnSzxVecz0hRzoaXcXNu2nmiqvApOZOkI5L6dlVaKtIYeujD0s49MzBHVuFWkMNVxhqWcekZfBroirU+FqwwlPUDTMwRWq+WtA4fWp8NTUydMQyUVBTXw9QQ1axBaYDLpRQcqAUXgVdYWp6gaYOKNnFa+AxJwy5RvSccViKZWDORVKYnhnelMWmJibKiFnPWJ9+7CuRYCCXopZQyJIt7D8/v8AiiiC5H6qZgj1sFAfLkuddPCnnXI8hl4vCL8GkkJJkvmdlW1tfpv96CJepxEYMSTYN+HQX05b16JZsRGkmBhsYZFIDcO5Xbn5CsqTAyRuXfKUz5broQfDlTc+5Kw3e4P4wf8AUiqU7wIf+sK5UahekHfC60NsNrXoHwtBbC15uoejSZ52SDqnxpdsNXo5MLQHwdGoDijAOGrnw1bbYSq/CU85OVGQMPVlwtbC4SiLhaTmLKY6YT9NFGDHPbnWwmFq0uAE8MkLEhZFKkjvFqWcKo8ji+lcJh2VYxxWZWuQNEI2B8TfSvL/APNYpMW5bNYsCVNx2EeVF6eOHwk02HSYtZwQlyuq3Fj2WDGvPCRfiWcGyZuqt729g2q7OOc3ZofHSz9ItIkrpLK5GjXy7aeAH2r1X9OYqXFu+GlZpiozcXL9DbTkTv2V4ecR8QMDkPI9vu1e5/8Ax/JhcRP8I2Jn+IjUyiM6LfRT4+/Nt0GE7kbTYOuDCV6JsLVPhanVOtxRhjCUVcL+mttcLRVwtNYoqRhjC0xFhtR1a1xhKJHhaeqJoyxhra0XhWcHJyrWXDVb4Wq1CUlYLCQJnVWi1OtCn6FxOR8iLIvEuFy3svs1pYWJkbXatmF1EYPZSWKRN1weC/47Ef8ASqV7njr+X6VKeqLUfgzzhaE+G/RX55wU+OwEbRYLH4vDxsLssM7oCN+R7z604vS/TaqYh0xjetGsZtO18ouQL3v+I+tL67FvlEr5X4fcJYBHqTlB3ob4clQwF1OzCvg+JkxU0bRYvF4ueNrZhJM7qbbHU0SGTFwLF8PjMbHw0yLkxLrkX8o108qtfAxFy0Uvl12Pt7YeqHD18dHSnS5Qx/8AK4/KRY5sS+3jerxdM9MQRNGOlcdw2BGs7MfInUU+hn5RXVrwfYBh6uIP018U+J6QZSp6S6RsDqvxcmv1qLiMamqdJdIL4YuT+aOgxH3F1S8H25YaIkWo0vXxLD4/pVZFkj6Tx5IByscU5yg+JpmLpf8AqBkd06UxZtpY4liTUS+FOPcOpj4Pa/1j/Rw6Z6Rw+LjWR1ykTIh1YDY3t5anz0tXjP67/pvD9EdKJFhcO8eHmiUxsut2AysCeWq3/wDdRR0r0+8Q+I6ZxKrm+VZWLedqVnxmOx8Kw4zG4ueOFhkinJbXtuT2VMcOUXTaM5SjLsMYL+helMb/AE2nSMa5pGsYcMPmkUkXY66Dn229K93/AET/AEzB0fgYsXiMKy46zL/c3QbGw5A2B+lfPxjMaS6Q9O9IpKy5RFNLIoI7B1qVxmN6bj4sOKxvSEga2cpinkU9lzfSnoTxHSaHHEjHsfbZuHErGZxGgF7sbAeNLR4vBSTPHFisO8qjMyLKGIB8DtXxTFY3E4+BosXisTiIer1ZJ2K3A00JpM4CFlBMGnK9yPvTX+fP2G/lfh9+LwxsgeSNGkYKoLAZmIvYdulMBUT5zlr89HCjjCUD+6pBDgm4I2seVqPjJcVjCi46eXFNHonHkZwvhc0fXzv+hdV+H6BXK+isptz9+H0oyRZY83adq/OKcSGMxxAou+XULcX5eZ9TTcHSXSeFQJhcfi8PEdQsU7KvkAbUfX4nsLqV4P0Oq0VY6/OsnTXS8siNJ0njXdLlXMrErfcg30vU/wCe6bOn/K42w2/vt/NLocT2DqF4P0cIxbXbvrjTwpKsDzIsrfKhYBje+w8j6V+bm6d6aB63SuNv/wCu380pNisTPiBPPI0k67SyWZxbXRiKfQz9iNdeD9QZH/VUr8w/H43/APpm9a7S6GfsGuvA5wf01YK6i2RPA8q5jRiYFDICyEcu+h9HGTFEHO2UMAVr1/wwLoXL2lCxKDy570bLHtdnO3y8611XCQR2yoS2mY8hr78hQmlRVKRBdr27Pd6ewxGHBDNnkItyVqvJAo1VwoH5api8QXW0mttzpv2UlE0+JyJEju43CjQDTfvpAMSPDYlyzaX1oLSG7fCQnNp8vOtvo/oRIrvipASBzHiLW7djTzGCDO7Rr1TqAdb2Fx5VSYHnx0bI8Sy4qRlJ/CtF4a4Y5VAAte/I1oTOgU2frnZbd38A1k4yUqzcENIWsAO2lJ7DAPiJJMRaDPe2uU2rVwkEnDDyNc94ufWqYPBx4WLiEXk3PdWrhFAQgrrbKvidffjUxiv6YGL0zhnSETQLpubdb07KzsDjCxym2Yb5q9nJhhiI3Q6gtky9h5D968j01gpuj55ZArZb2Ftt6dLlCY2IIcSj3fKSRe2tKz4PHYO7heJENSU1+lVwMgDLfUHS/f2VuYLHdUKV3A1/Nt/FW0mthWYKPhm0C5efV0N6NIgaNTCFJ5iTnWpP0Rg8TJxFHDewyspsNaXl6ElUZcJKHI2zed/qKyaaARXByHra6/h5V1cKyIfmTXcbCmE+JwT8PEKdBfTbl/I9RTyYmKYsG5G3v6VOYDzGJlGGkOcZr/ioscscyCysv6jTfSOBGLVjGchGxPPbf3zNICCdAoRLKDa/fTSkAXhOTZspB2NV4QRjxEsOR7aEss0TZHW1gDRjiJJwQUY73NK2IreOpVuF+muUbgba4pMSjhtetlv4/wCvvSAhODtOesDqD26k/egdHRSTxxFdMxZFH6iND63rZw/R/wASAs5zIFBuR+K17f8AiPWrjxuOjOjmOIe0AY5v+229MYLAYvEzoojZTIjvmJAzZf8ANbmEw0GHxEJhVct2DMulwf8ANvUVIcQBJC4F366gXt8zfuNPWnXkewhh+joocUxxAEgIGQMCRe9r/StwiFC4VAkjuRci1tP4Ws2WRWkQuALWtcfMozG+nkfWlcVijIgkGbNISCu5FybG3hf607pbBZqSvxHVkZCQDa56pXU37+dZMkzIXicpkkF8qnW1zr5k/ah/Euf7i34UAGS+1sw3/cdvgKSlxbF5coyrICMra6dl+VtPHUcqmwOS4gmO9wXa5UbWGt/pb19H+hcNnjzSw3WxAygEg8t+d96zujlGKmHE0BPWYXIA5H1ueX7V6jBrFAAt43RsxzLbXXl9KzbcmkOIuVysOrnuo1HLn676eNHjszRlV6kire2l9b6fT0rjzCCc5bXNyM1vzWO3dQ8NiJHgjUgBlZQrflbLz7rVtKSWwM0cKZJGdpNDYggNckhRv75CgdJQDEYN0dVZdsx3JuBegQ4pJDEMgRHcovfpcn/tX1rRE4cZ75TGmYs7eQsPfKoUl3BHgMSDBMVXk1uVMYedmGTrgr8o7QNx77a0/wCoeiUUSzKxUXBFtyTbwtz+lec1hROJc2+Ym99u+pzuLJao9HhMRbrBmOXKLt33/gDzrRhxyovVFhGzatyII/kV5SKZ1HFQLw3W5A7+Q9RTSYnhAN1hrlcW52HLvsPIVblsF0er40eIjtJGuutrDv8A4tWH0tgViEs+FOW+i3b9uW2nhSuFxTrDdmubjXuO49b04mKWdCB+EX7f9UJWF2ZkMxLBM2pbXxP80eaVChC7gg+VAj6KVTI6ytcG4797D0t9K0ZcCjR8JNFy2tzzBri/rTufDQCHUsQBqNx79KojqoAy5d605MDDwphES2ZmJYdh/wB/Ss/E4OQILgM+VRptsb/ai3wLc58QtSkrS/8AWqUtw3NrB5Io8trsmXJZdBcXP3+lNwYiTDBcxsrNxAT+oa+QtWW0xuzgBZJEsQfxHUj9vWuS44y8JIhmVI+fYBe30qcyKNhMSrMzuCoIzm42S/3JJ+lZnxXDiFs2YAptply3OnIAkezVpGXECSJmJMzRi43CKbn6AnzHZSZklZVZP/2zfLf5eraxP1PkOw0WAxipZJG60oKiMKL62vckfv5jtocjSjizS6l20DbLobn7D2aXw0qysQ5OVDbvNrDXutv4UOaVzBIj5bBg3XA25j6nTtFNMR0zJIeuF6z7AkDnp9fpVinxLCRmNyTsLgdpHgP9Ukpk48l165bUty8uwmt3CQCGIniOkyuc+mhGgJ5a7/6qZPYEhjo6BsLIqxqzlsrXA+bXcanYjfXvrUibIZGYgKgBHWFiM2+3fSXGXJw0kkFiyqAway32O+nh+9qpjMWYYVkjsjDrFT3W+1OCVFPY4mJK9ICyXWNbAFtDoR/mqJnjwTuhcmwu5O9go0HLdhQeIwndoMojmGcX2XTb0P0oeFmX4FnLFpGkCLc/Kblhb/4g1TaJNABo4lWGEtlxTiE9ga+h9LetR53zRM86sX/uMynYgmwt4WPfSIZ3w6CEl2AfqrtcIArfU+tMRrGyrIpIgjFwv5yDYg+gH/uNSkmMcSQYpS056r2ZW3I2II02FvT0rzmPw91HzFcpYEi11vvt9uytyTEgyMqIucswQDmNb38B9u8UKRAwm6q5CAxL2FrC3nc6d+9TiJOIHmIpcgWNlIXUWA18bV04gqujDKRp26C3vypyfDLYqUQgm4BW4Ph9Ky3w7RvcD+2AOrcgevKsFJoTQy8rSCQG65nzWHeDpWn0dMkbKfmB6rMu99bH7etYaStmJYXU/jA0Fu7l/mm4nyqrDqjS7eVvfs10RmI9CZlTL3pax+30v5134pG1JtlYNfz/ANetY3xXFQjNY3Bt6fv96pDi+oy/N1t/fiDVvEsDfjxymZgo0Mei/egcZU0GpFxfwH+/WsiPEKqh/wAWUFfG+tFScZzG2+v1P+KiM9wsfzLUrMs/5qlXmQWVMgaZEDHPGjo3hlvp4n9qAk3DkYJmuq2PUv2D7E1wyH+1LKFCtHbKndca++2gQyKVkZyQALm3iLCudjNGOW0Msi9VVAOY/hXu7bnQc/WqYWWSWQmwU/MFvso+UerfvXDiSsaoTkEbK2g0Fhp4nX3alcMeE6SPra5AOpaw27/HxqkwDRMVH9oAEi1yNgddfI2ri4gFjsQOtfnbv9fWkpGcFxbX5uGmwNtz2/5qxZrgJcpztueVU5UBp4TkZWezXs1rgka28bXrSililiUKtlLuEYXsVtfb3yrPwsuULdxte5YEdnv/ABT0ZdcUua7gqWut7m4bXfbW5rO8zKQ+jvdVkNkfrCwA1sBf0t9KSny2eMqygspW240N1+tUeViiJItgy5ddxrcftSOKkMmZkfRADrvb/dvWt7VEsaxNo3RIyBkkyA/a/lY1SRkhwSRoyrdQ/PqkXB/8mFLMzyYk4ebaQ3Yjlpm09PQVwSkmRLX4mUOfy7Nb1X6is2xD0SyQNIpZVyAhLbgklQD6D0FVlxBhciEtww3DQHZgLH7lfSlRMzGSUsWZrutu0X09TXeMYxwrgImljbUg2A9bnwpWBrKqrE0sxWMEdWy9Yk65dO4fXvFXEphxAaOyjJ8pW69vWHbqfM1lw4hGkUHZggQdoA39bW7hRoZg6s0pzK+UXbddb6e+VaRp8jRJMMZZ3RGYOXLrGSBYWG3lSsmFEk4TEARsbBWfkTenJBFJJNw7WFit9u6/mbb/AMUmyhIBIZMzC9xxCWG2n1tXPiRplGccmHlOchrgiw2qpkWIXU5eXKm5k4kTtoMhtY8+WlIlWdgiHM19CfwnvpRkIvm4TiUrdSLuDtY7j32ijPKCytzPzN3UtE2dBHbrCylTz5X9KGZHVQn4kJHlWjlRIznstlawQkW873+lW41nH5rWYe/Ol0KBhl2YZl8Lf5qM9ypO1yPfvnU2A1/yFSl/hRUosCHFcOLhqgJyFTf6WoaHrpEnzMw1PZ7NSpQMhlu5PXLlrKS3y+FTigPnQnTRA3IVKlMCjlh2jMLk6e+yjRrkV5l1AbLc76+xUqUpDNBxDHGjNPc5r5SmtvHwqRyPDiLFgSBdrXvbs9b+zUqVOGrbGwuJkDSBk6xsCf0nlSMmIKExHQSC1t7Aj/AqVK0ltEk7FMXJf8VrL53v96jCzsS3zAN5lS33qVKa3QjsblZ4zuyqDfvOooMkhzMAbh3bTu3/AHqVKXCAfklsVA2VSPIE6fUUYsVWN+RBdgNNdvua7UrRAR0QSmJkYPGBISG0Itt6/el1ZZXUqrhpNbXHPX331KlZ4vBQLEnhNwx1gpsGAtzN6SxK2sPOu1Kx7gwcjZhnX5eyglyD31KlXLkRFcCM9gFh6iiyDdDta4qVKOwC/Fm7alSpUgf/2Q=="}
            alt="Camera live"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: 500,
              objectFit: 'contain',
              display: 'block',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'http://192.168.43.168:5000/stream';
            }}
          />
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '8px 16px',
            background: 'rgba(239, 68, 68, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{
              width: 6,
              height: 6,
              background: 'white',
              borderRadius: '50%',
              animation: 'pulse 2s infinite',
            }} />
            LIVE
          </div>
        </div>
      </div>

      {showHistory && (
        <CameraHistoryModal onClose={() => setShowHistory(false)} />
      )}
    </>
  );
};

export default CameraPanel;




