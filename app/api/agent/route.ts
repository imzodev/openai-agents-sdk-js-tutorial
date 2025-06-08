import { NextResponse } from 'next/server';
import {Agent, handoff, InputGuardrail, InputGuardrailTripwireTriggered, run, RunContext, setDefaultOpenAIKey, tool} from '@openai/agents';
import { z } from 'zod';

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY', 'OPENAI_API_MODEL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingEnvVars.join(', ')}`;
  console.error('ERROR:', errorMessage);
  throw new Error(errorMessage);
}

const { OPENAI_API_MODEL, OPENAI_API_KEY } = process.env;

setDefaultOpenAIKey(OPENAI_API_KEY!);

const DatosTransferenciaSoporte = z.object({
  tipoProblema: z.string().describe('Tipo de problema técnico'),
});
type DatosTransferenciaSoporte = z.infer<typeof DatosTransferenciaSoporte>;

const DatosTransferenciaGeneral = z.object({
  informacionSolicitada: z.string().describe('Tipo de información solicitada')
});
type DatosTransferenciaGeneral = z.infer<typeof DatosTransferenciaGeneral>;


export async function POST(request: Request) {
  try {
    const { query } = (await request.json()) as { query: string };

    // Agente para validar el tema
    const agenteValidador = new Agent({
      name: 'Validador de Tema',
      model: OPENAI_API_MODEL,
      instructions: `Eres un validador que determina si una consulta es sobre soporte técnico o información general.

      Información general:
      - Preguntas sobre horarios de atención
      - Preguntas sobre ubicaciones
      - Preguntas sobre contacto
      - Preguntas sobre políticas
      - Preguntas sobre preguntas frecuentes
      
      Soporte técnico:
      - Preguntas sobre productos o servicios
      - Soporte técnico
      - Información general de la empresa
      
      Responde con un JSON que contenga:
      - esValido: true si es sobre soporte o información general, false en caso contrario
      - razon: explicación breve de por qué es o no es válida`,
      outputType: z.object({
        esValido: z.boolean(),
        razon: z.string()
      })
    });

    const validarTemaGuardrail: InputGuardrail = {
      name: 'Validador de Tema',
      async execute({ input, context }) {
        
        try {
          const resultado = await run(agenteValidador, input, { context });
          
          const output = resultado.finalOutput as { esValido?: boolean; razon?: string };
          const esValido = output?.esValido ?? false;
          const razon = output?.razon || 'Razón no especificada';
          
          
          return {
            outputInfo: { razon },
            tripwireTriggered: esValido ? false : true
          };
        } catch (error) {
          console.error('Error en el guardrail:', error);
          // En caso de error, mejor permitir el paso que bloquear incorrectamente
          return {
            outputInfo: { razon: 'Error en la validación' },
            tripwireTriggered: true
          };
        }
      }
    };
    

    const crearAgenteSoporte = () => {
      return new Agent({
        name: 'Agente de Soporte Técnico',
        instructions: `Eres un experto en soporte técnico. Ayuda con:
        - Problemas con productos o servicios
        - Guías de configuración
        - Mensajes de error
        - Preguntas sobre funcionalidades
        
        Sé paciente y claro en tus explicaciones. Responde en español.`,
        model: OPENAI_API_MODEL,
      });
    };
    
    const crearAgenteGeneral = () => {
      return new Agent({
        name: 'Agente de Información General',
        instructions: `Proporciona información general sobre:
        - Horarios de atención
        - Ubicaciones
        - Contacto
        - Políticas
        - Preguntas frecuentes
        
        Mantén un tono amable y profesional en español.`,
        model: OPENAI_API_MODEL,
      });
    };

    const agenteSoporte = crearAgenteSoporte();
    const agenteGeneral = crearAgenteGeneral();
    
    const agent = new Agent({
      name: 'Asistente Principal',
    instructions: `Eres un asistente principal que ayuda a los usuarios a resolver sus consultas. 
    Puedes transferir la conversación a agentes especializados cuando sea necesario.
    Al transferir, asegúrate de proporcionar el contexto necesario.
    Mantén un tono amable y profesional en español.`,
      model: OPENAI_API_MODEL,
      inputGuardrails: [validarTemaGuardrail],
      handoffs: [handoff(agenteSoporte,{
        toolNameOverride: 'transferir_a_soporte',
        toolDescriptionOverride: 'Transferir al agente de soporte técnico para problemas técnicos',
        inputType: DatosTransferenciaSoporte,
        onHandoff: (ctx: RunContext<DatosTransferenciaSoporte>, input) => {
          console.log(`🔧 Transferido al área de soporte. Tipo de problema: ${input?.tipoProblema}`);
        }
      }), handoff(agenteGeneral, {
        toolNameOverride: 'transferir_a_informacion',
        toolDescriptionOverride: 'Transferir al agente de información general',
        inputType: DatosTransferenciaGeneral,
        onHandoff: (ctx: RunContext<DatosTransferenciaGeneral>, input) => {
          console.log(`ℹ️ Transferido al área de información general. Solicitud: ${input?.informacionSolicitada}`);
        }
      })]
    });
    
    const result = await run(agent, query);


    
    // For now, just return a static response
    return NextResponse.json({ message: result.finalOutput });
  } catch (error) {
    console.error('Agent error:', error);

    if (error instanceof InputGuardrailTripwireTriggered) {
      let razon = 'La consulta no está relacionada con los temas soportados';

      // El error contiene la razón en result.output.outputInfo.razon
      if (error.result?.output?.outputInfo?.razon) {
        razon = error.result.output.outputInfo.razon;
      }

      return NextResponse.json(
        { 
          message: razon,
          razon: razon,
          tipo: 'fuera_de_tema',
          sugerencia: 'Por favor, realiza una consulta relacionada con nuestros productos, servicios o información general.'
        }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
